import React, { useEffect, useState } from "react";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import io from "socket.io-client";
import "../Styles/noteTaker.css";

export const NoteTaker = () => {
  const [isMicOn, setIsMicOn] = useState(false);
  const [socket, setSocket] = useState(null);

  // Keep final and partial transcripts separate
  const [fullTranscript, setFullTranscript] = useState("");
  const [currentPartial, setCurrentPartial] = useState("");

  // Audio references
  const [mediaStream, setMediaStream] = useState(null);
  const [audioContext, setAudioContext] = useState(null);
  const [processor, setProcessor] = useState(null);

  useEffect(() => {
    const newSocket = io("http://localhost:5000");
    setSocket(newSocket);

    // Listen for transcription data from server
    newSocket.on("speechData", (data) => {
      console.log("Received speechData event:", data);
      const { transcript: text, isFinal } = data;

      if (isFinal) {
        // Append the final text to our fullTranscript
        setFullTranscript((prev) => prev + text.trim() + " ");
        // Clear partial
        setCurrentPartial("");
      } else {
        // Overwrite current partial
        setCurrentPartial(text);
      }
    });

    newSocket.on("googleCloudStreamError", (errMsg) => {
      console.error("Speech Stream Error:", errMsg);
    });

    // Cleanup
    return () => {
      newSocket.disconnect();
    };
  }, []);

  const startRecording = async () => {
    if (!socket) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const context = new (window.AudioContext || window.webkitAudioContext)();
      const source = context.createMediaStreamSource(stream);
      const scriptProcessor = context.createScriptProcessor(4096, 1, 1);

      scriptProcessor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const pcm16Data = float32ToInt16(inputData);
        socket.emit("sendAudioData", pcm16Data);
      };

      source.connect(scriptProcessor);
      scriptProcessor.connect(context.destination);

      setMediaStream(stream);
      setAudioContext(context);
      setProcessor(scriptProcessor);

      socket.emit("startGoogleCloudStream");
    } catch (err) {
      console.error("Error accessing microphone:", err);
    }
  };

  const stopRecording = () => {
    if (!socket) return;
    socket.emit("stopGoogleCloudStream");

    // Disconnect
    if (processor) processor.disconnect();
    if (audioContext && audioContext.state !== "closed") audioContext.close();
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
    }
    setProcessor(null);
    setAudioContext(null);
    setMediaStream(null);
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

  // Helper: Convert Float32 to Int16
  const float32ToInt16 = (float32Array) => {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      let s = Math.max(-1, Math.min(1, float32Array[i]));
      s = s < 0 ? s * 0x8000 : s * 0x7fff;
      int16Array[i] = s;
    }
    return int16Array;
  };

  return (
    <div className="note-taker-container">
      {/* Header row: Title left, mic icon right */}
      <div className="note-taker-header">
        <h1 className="note-taker-title">Note Taker</h1>
        <div className="mic-icon" onClick={handleMicToggle}>
          {isMicOn ? <MicIcon /> : <MicOffIcon />}
        </div>
      </div>

      {/* Transcript box below */}
      <div className="transcript-box">
        <pre>{fullTranscript + currentPartial}</pre>
      </div>
    </div>
  );
};
