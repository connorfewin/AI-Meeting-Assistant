import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import Button from "@mui/material/Button";
import NotInterestedIcon from "@mui/icons-material/NotInterested";
import "../Styles/brain.css";
import { TranscriptParagraph } from "./TranscriptParagraph";
import { BrainParagraph } from "./BrainParagraph";

export const TheBrain = () => {
  const [isMicOn, setIsMicOn] = useState(false);
  const [paragraphs, setParagraphs] = useState([]); // Finished paragraphs.
  const [currentParagraph, setCurrentParagraph] = useState(""); // Accumulated transcript.
  const [currentInterim, setCurrentInterim] = useState(""); // Latest interim transcript.

  const socketRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const processorRef = useRef(null);

  // Ref for the transcript display container
  const transcriptDisplayRef = useRef(null);

  // Keep state values in refs for immediate access in event handlers
  const currentParagraphRef = useRef("");
  const currentInterimRef = useRef("");

  useEffect(() => {
    currentParagraphRef.current = currentParagraph;
  }, [currentParagraph]);

  useEffect(() => {
    currentInterimRef.current = currentInterim;
  }, [currentInterim]);

  useEffect(() => {
    socketRef.current = io("http://localhost:5000");

    const handleSpeechData = ({ transcript, isFinal }) => {
      if (isFinal) {
        // Append final transcript to the working paragraph.
        setCurrentParagraph((prev) => prev + transcript.trim() + " ");
        // Clear any interim text.
        setCurrentInterim("");
      } else {
        // Update interim transcript.
        setCurrentInterim(transcript);
      }
    };

    socketRef.current.on("speechData", handleSpeechData);
    socketRef.current.on("googleCloudStreamError", (errMsg) => {
      console.error("Speech Stream Error:", errMsg);
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  // Auto-scroll to the bottom when new content is added
  useEffect(() => {
    if (transcriptDisplayRef.current) {
      transcriptDisplayRef.current.scrollTo({
        top: transcriptDisplayRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [paragraphs, currentParagraph, currentInterim]);

  const startRecording = async () => {
    if (!socketRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const context = new (window.AudioContext || window.webkitAudioContext)();
      const source = context.createMediaStreamSource(stream);
      const scriptProcessor = context.createScriptProcessor(4096, 1, 1);

      scriptProcessor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const pcm16Data = float32ToInt16(inputData);
        socketRef.current.emit("sendAudioData", pcm16Data);
      };

      source.connect(scriptProcessor);
      scriptProcessor.connect(context.destination);

      mediaStreamRef.current = stream;
      audioContextRef.current = context;
      processorRef.current = scriptProcessor;

      socketRef.current.emit("startGoogleCloudStream");
    } catch (err) {
      console.error("Error accessing microphone:", err);
    }
  };

  const stopRecording = () => {
    if (!socketRef.current) return;

    socketRef.current.emit("stopGoogleCloudStream");

    if (processorRef.current) processorRef.current.disconnect();
    if (audioContextRef.current && audioContextRef.current.state !== "closed")
      audioContextRef.current.close();
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
    }

    processorRef.current = null;
    audioContextRef.current = null;
    mediaStreamRef.current = null;
  };

  const handleMicToggle = () => {
    if (!isMicOn) {
      // Fresh start for new question.
      setCurrentParagraph("");
      setCurrentInterim("");
      setIsMicOn(true);
      startRecording();
    } else {
      // Stop recording, flush current transcript, and clear working data.
      stopRecording();
      const combined = (currentParagraphRef.current + currentInterimRef.current).trim();
      if (combined) {
        setParagraphs((prev) => [...prev, combined]);
      }
      setCurrentParagraph("");
      setCurrentInterim("");
      setIsMicOn(false);
    }
  };

  const handleClear = () => {
    // Clear all finished paragraphs and reset working transcript.
    setParagraphs([]);
    setCurrentParagraph("");
    setCurrentInterim("");
  };

  // Convert Float32Array audio data to Int16Array.
  const float32ToInt16 = (float32Array) => {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return int16Array;
  };

  return (
    <div className="brain-container">
      <div className="brain-header">
        <h1 className="brain-title">Brain</h1>
        <div className="button-group">
          <Button
            variant="outlined"
            onClick={handleClear}
            className="brain-button"
            sx={{ marginRight: "10px"}}
          >
            <NotInterestedIcon />
              Clear
          </Button>
          <Button
            variant="contained"
            onClick={handleMicToggle}
            className="brain-button"
          >
            {isMicOn ? "Stop" : "Start"}
          </Button>
        </div>
      </div>
      <div className="transcript-display" ref={transcriptDisplayRef}>
        {paragraphs.map((para, idx) => (
          <BrainParagraph key={idx} text={para} inProgress={false} />
        ))}
        {(currentParagraph || currentInterim) && (
          <BrainParagraph
            text={(currentParagraph + currentInterim).trim()}
            inProgress={true}
          />
        )}
      </div>
    </div>
  );
};
