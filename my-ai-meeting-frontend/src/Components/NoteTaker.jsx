// NoteTaker.jsx
import React, { useEffect, useRef, useState } from "react";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import io from "socket.io-client";
import "../Styles/noteTaker.css";

export const NoteTaker = () => {
  const [isMicOn, setIsMicOn] = useState(false);
  const [fullTranscript, setFullTranscript] = useState("");
  const [currentPartial, setCurrentPartial] = useState("");

  const socketRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const processorRef = useRef(null);
  const pauseTimerRef = useRef(null);
  const currentPartialRef = useRef("");

  // Keep currentPartialRef in sync with state
  useEffect(() => {
    currentPartialRef.current = currentPartial;
  }, [currentPartial]);

  useEffect(() => {
    socketRef.current = io("http://localhost:5000");

    const handleSpeechData = ({ transcript, isFinal }) => {
      if (isFinal) {
        setFullTranscript((prev) => prev + transcript.trim() + " ");
        setCurrentPartial("");
      } else {
        setCurrentPartial(transcript);
      }
      // Reset the pause timer on every speechData event
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
      pauseTimerRef.current = setTimeout(() => {
        const partial = currentPartialRef.current;
        if (partial) {
          setFullTranscript((prev) => prev + partial.trim() + "\n");
          setCurrentPartial("");
        } else {
          setFullTranscript((prev) =>
            prev.endsWith("\n") ? prev : prev.trim() + "\n\n"
          );
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

  // Convert Float32Array audio data to Int16Array
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
      <div className="transcript-box">
        <pre>{fullTranscript + currentPartial}</pre>
      </div>
    </div>
  );
};
