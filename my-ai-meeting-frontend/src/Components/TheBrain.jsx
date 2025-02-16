import React, { useEffect, useRef, useState, useCallback } from "react";
import Button from "@mui/material/Button";
import NotInterestedIcon from "@mui/icons-material/NotInterested";
import "../Styles/brain.css";
import { BrainParagraph } from "./BrainParagraph";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";

export const TheBrain = () => {
  const [isMicOn, setIsMicOn] = useState(false);
  const [paragraphs, setParagraphs] = useState([]);
  const [currentParagraph, setCurrentParagraph] = useState("");
  const [currentInterim, setCurrentInterim] = useState("");
  const transcriptDisplayRef = useRef(null);

  // Refs for accessing transcript values immediately.
  const currentParagraphRef = useRef("");
  const currentInterimRef = useRef("");

  useEffect(() => {
    currentParagraphRef.current = currentParagraph;
  }, [currentParagraph]);

  useEffect(() => {
    currentInterimRef.current = currentInterim;
  }, [currentInterim]);

  // Handle incoming speech data (no pause timer here).
  const handleSpeechData = useCallback(({ transcript, isFinal }) => {
    if (isFinal) {
      setCurrentParagraph((prev) => prev + transcript.trim() + " ");
      setCurrentInterim("");
    } else {
      setCurrentInterim(transcript);
    }
  }, []);

  const { startRecording, stopRecording } = useSpeechRecognition(handleSpeechData);

  // Auto-scroll to the bottom when new text is added.
  useEffect(() => {
    if (transcriptDisplayRef.current) {
      transcriptDisplayRef.current.scrollTo({
        top: transcriptDisplayRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [paragraphs, currentParagraph, currentInterim]);

  const handleMicToggle = () => {
    if (!isMicOn) {
      // Fresh start.
      setCurrentParagraph("");
      setCurrentInterim("");
      setIsMicOn(true);
      startRecording();
    } else {
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
    setParagraphs([]);
    setCurrentParagraph("");
    setCurrentInterim("");
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
            sx={{ marginRight: "10px" }}
          >
            <NotInterestedIcon />
            Clear
          </Button>
          <Button variant="contained" onClick={handleMicToggle} className="brain-button">
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
