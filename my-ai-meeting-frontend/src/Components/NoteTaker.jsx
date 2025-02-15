import React, { useEffect, useRef, useState } from "react";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import io from "socket.io-client";
import "../Styles/noteTaker.css";
import { TranscriptParagraph } from "./TranscriptParagraph";

export const NoteTaker = () => {
  const [isMicOn, setIsMicOn] = useState(false);
  const [paragraphs, setParagraphs] = useState([]); // Finished paragraphs.
  const [currentParagraph, setCurrentParagraph] = useState(""); // Accumulated final transcript.
  const [currentInterim, setCurrentInterim] = useState(""); // Latest interim transcript.

  const socketRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const processorRef = useRef(null);
  const pauseTimerRef = useRef(null);
  
  // Ref for the transcript display container
  const transcriptDisplayRef = useRef(null);

  // Refs to keep our state values updated in the timer callback.
  const currentParagraphRef = useRef("");
  const currentInterimRef = useRef("");

  useEffect(() => {
    currentParagraphRef.current = currentParagraph;
  }, [currentParagraph]);

  useEffect(() => {
    currentInterimRef.current = currentInterim;
  }, [currentInterim]);

  useEffect(() => {
    socketRef.current = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000');

    const handleSpeechData = ({ transcript, isFinal }) => {
      if (isFinal) {
        // Append final transcript to the working paragraph.
        setCurrentParagraph((prev) => prev + transcript.trim() + " ");
        // Clear any interim text.
        setCurrentInterim("");
      } else {
        // For interim results, update the interim text only.
        setCurrentInterim(transcript);
      }

      // Reset the pause timer on every speech event.
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
      pauseTimerRef.current = setTimeout(() => {
        // When there's a pause, combine accumulated final results with the latest interim text.
        const combined = (currentParagraphRef.current + currentInterimRef.current).trim();
        if (combined) {
          setParagraphs((prev) => [...prev, combined]);
          // Clear the working paragraph and interim.
          setCurrentParagraph("");
          setCurrentInterim("");
        }
      }, 3000);
    };

    socketRef.current.on("speechData", handleSpeechData);

    socketRef.current.on("googleCloudStreamError", (errMsg) => {
      console.error("Speech Stream Error:", errMsg);
    });

    return () => {
      socketRef.current.disconnect();
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    };
  }, []);

  // Auto-scroll to the bottom whenever paragraphs or the working transcript changes
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
      setIsMicOn(true);
      startRecording();
    } else {
      setIsMicOn(false);
      stopRecording();
    }
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
    <div className="note-taker-container">
      <div className="note-taker-header">
        <h1 className="note-taker-title">Note Taker</h1>
        <div className="mic-icon" onClick={handleMicToggle}>
          {isMicOn ? <MicIcon /> : <MicOffIcon />}
        </div>
      </div>
      <div className="transcript-display" ref={transcriptDisplayRef}>
        {paragraphs.map((para, idx) => (
          <TranscriptParagraph key={idx} text={para} inProgress={false} />
        ))}
        {/* Display the working paragraph (final + interim) in its own box until it's flushed */}
        {(currentParagraph || currentInterim) && (
          <TranscriptParagraph text={(currentParagraph + currentInterim).trim()} inProgress={true} />
        )}
      </div>
    </div>
  );
};
