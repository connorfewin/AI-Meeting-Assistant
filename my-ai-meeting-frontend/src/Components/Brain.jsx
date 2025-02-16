import React, { useState, useRef } from "react";
import "../Styles/brain.css";

// Possible states for our Brain recording flow:
const BRAIN_STATES = {
  IDLE: "idle",
  RECORDING: "recording",
  PROCESSING: "processing",
};

export const Brain = () => {
  const [brainState, setBrainState] = useState(BRAIN_STATES.IDLE);
  const [transcript, setTranscript] = useState(""); // New state for recorded text
  const audioContextRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const processorRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const gptRequestRef = useRef(null);

  // Start capturing audio
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // Create an AudioContext and a ScriptProcessor node
      const context = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = context;
      const source = context.createMediaStreamSource(stream);
      const processor = context.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      // Reset recorded chunks and transcript
      recordedChunksRef.current = [];
      setTranscript("");

      // On each audio process event, convert and store the audio data
      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const pcm16Data = float32ToInt16(inputData);
        recordedChunksRef.current.push(pcm16Data);
      };

      source.connect(processor);
      processor.connect(context.destination);
    } catch (err) {
      console.error("Error accessing microphone:", err);
    }
  };

  // Stop the recording and cleanup
  const stopRecording = () => {
    if (processorRef.current) {
      processorRef.current.disconnect();
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close();
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    processorRef.current = null;
    audioContextRef.current = null;
    mediaStreamRef.current = null;
  };

  // Convert Float32 audio data to Int16
  const float32ToInt16 = (float32Array) => {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return int16Array;
  };

  // Handle the main button click to transition between states
  const handleButtonClick = () => {
    if (brainState === BRAIN_STATES.IDLE) {
      // Start Recording
      setBrainState(BRAIN_STATES.RECORDING);
      startRecording();
    } else if (brainState === BRAIN_STATES.RECORDING) {
      // Stop Recording and transition to processing
      stopRecording();
      setBrainState(BRAIN_STATES.PROCESSING);

      // Combine recorded chunks into one buffer (for further processing or sending to GPT)
      const totalLength = recordedChunksRef.current.reduce(
        (acc, chunk) => acc + chunk.length,
        0
      );
      const combinedBuffer = new Int16Array(totalLength);
      let offset = 0;
      for (const chunk of recordedChunksRef.current) {
        combinedBuffer.set(chunk, offset);
        offset += chunk.length;
      }

      // Simulate a GPT call (processing the audio) with a timeout
      gptRequestRef.current = setTimeout(() => {
        // Simulate punctuation on the transcript (for demonstration purposes)
        const simulatedTranscript =
          "This is your simulated, punctuated transcript.";
        setTranscript(simulatedTranscript);
        setBrainState(BRAIN_STATES.IDLE);
        gptRequestRef.current = null;
      }, 5000);
    } else if (brainState === BRAIN_STATES.PROCESSING) {
      // If processing is taking too long, cancel the GPT call
      setBrainState(BRAIN_STATES.IDLE);
      if (gptRequestRef.current) {
        clearTimeout(gptRequestRef.current);
        gptRequestRef.current = null;
      }
    }
  };

  // Set button label based on current state
  let buttonLabel = "Start";
  if (brainState === BRAIN_STATES.RECORDING) {
    buttonLabel = "Stop";
  } else if (brainState === BRAIN_STATES.PROCESSING) {
    buttonLabel = "Cancel";
  }

  return (
    <div className="brain-container">
      <div className="brain-header-container">
        <h1 className="brain-title">Brain</h1>
        <button className={`brain-button ${brainState}`} onClick={handleButtonClick}>
          {buttonLabel}
        </button>
      </div>
      {/* Display the transcript below the header */}
      {transcript && (
        <div className="brain-transcript">
          <p>{transcript}</p>
        </div>
      )}
    </div>
  );
};
