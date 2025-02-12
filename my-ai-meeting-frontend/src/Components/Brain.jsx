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
  const gptRequestRef = useRef(null);

  const handleButtonClick = () => {
    if (brainState === BRAIN_STATES.IDLE) {
      // Start Recording
      setBrainState(BRAIN_STATES.RECORDING);
    } else if (brainState === BRAIN_STATES.RECORDING) {
      // Stop Recording => send to GPT
      setBrainState(BRAIN_STATES.PROCESSING);

      // Simulate GPT call
      gptRequestRef.current = setTimeout(() => {
        setBrainState(BRAIN_STATES.IDLE);
        gptRequestRef.current = null;
      }, 5000);
    } else if (brainState === BRAIN_STATES.PROCESSING) {
      // Cancel GPT call
      setBrainState(BRAIN_STATES.IDLE);
      if (gptRequestRef.current) {
        clearTimeout(gptRequestRef.current);
        gptRequestRef.current = null;
      }
    }
  };

  // Decide button label based on state
  let buttonLabel = "Start";
  if (brainState === BRAIN_STATES.RECORDING) {
    buttonLabel = "Stop";
  } else if (brainState === BRAIN_STATES.PROCESSING) {
    buttonLabel = "Cancel";
  }

  return (
    <div className="brain-container">
      <h1 className="brain-title">Brain</h1>
      <button
        className={`brain-button ${
          brainState === BRAIN_STATES.RECORDING
            ? "recording"
            : brainState === BRAIN_STATES.PROCESSING
            ? "processing"
            : "idle"
        }`}
        onClick={handleButtonClick}
      >
        {buttonLabel}
      </button>
    </div>
  );
};
