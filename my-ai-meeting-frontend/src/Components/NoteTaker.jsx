import React, { useEffect, useRef, useState, useCallback } from "react";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import GroupsIcon from "@mui/icons-material/Groups"; // Meeting icon
import "../Styles/noteTaker.css";
import { TranscriptParagraph } from "./TranscriptParagraph";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";

export const NoteTaker = () => {
  // Local state for transcription display.
  const [paragraphs, setParagraphs] = useState([]);
  const [currentParagraph, setCurrentParagraph] = useState("");
  const [currentInterim, setCurrentInterim] = useState("");

  // Separate booleans for mic and meeting.
  const [micOn, setMicOn] = useState(false);
  const [meetingOn, setMeetingOn] = useState(false);

  // For auto-scroll.
  const transcriptDisplayRef = useRef(null);
  const currentParagraphRef = useRef("");
  const currentInterimRef = useRef("");
  const pauseTimerRef = useRef(null);

  useEffect(() => {
    currentParagraphRef.current = currentParagraph;
  }, [currentParagraph]);

  useEffect(() => {
    currentInterimRef.current = currentInterim;
  }, [currentInterim]);

  // Handle incoming speech data.
  const handleSpeechData = useCallback(({ transcript, isFinal }) => {
    if (isFinal) {
      setCurrentParagraph((prev) => prev + transcript.trim() + " ");
      setCurrentInterim("");
    } else {
      setCurrentInterim(transcript);
    }

    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    pauseTimerRef.current = setTimeout(() => {
      const combinedText = (currentParagraphRef.current + currentInterimRef.current).trim();
      if (combinedText) {
        setParagraphs((prev) => [...prev, combinedText]);
        setCurrentParagraph("");
        setCurrentInterim("");
      }
    }, 3000);
  }, []);

  // Pass micOn and meetingOn flags into the hook.
  const { stopRecording } = useSpeechRecognition(handleSpeechData, micOn, meetingOn, setMeetingOn);

  // Auto-scroll.
  useEffect(() => {
    if (transcriptDisplayRef.current) {
      transcriptDisplayRef.current.scrollTo({
        top: transcriptDisplayRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [paragraphs, currentParagraph, currentInterim]);

  // Toggle the mic.
  const toggleMic = () => {
    setMicOn((prev) => !prev);
  };

  // Toggle meeting (screen share). If turning meeting off, also set mic off if desired.
  const toggleMeeting = () => {
    setMeetingOn((prev) => !prev);
  };

  // When both mic and meeting are off, stop recording.
  useEffect(() => {
    if (!micOn && !meetingOn) {
      stopRecording();
    }
  }, [micOn, meetingOn, stopRecording]);

  return (
    <div className="note-taker-container">
      <div className="note-taker-header">
        <h1 className="note-taker-title">Note Taker</h1>
        <div className="controls">
          <div
            className={`meeting-icon ${meetingOn ? "active" : "disabled"}`}
            onClick={toggleMeeting}
          >
            <GroupsIcon />
          </div>

          <div className="mic-icon" onClick={toggleMic}>
            {/* Show mic on/off icon based on micOn */}
            {micOn ? <MicIcon /> : <MicOffIcon />}
          </div>
        </div>
      </div>
      <div className="transcript-display" ref={transcriptDisplayRef}>
        {paragraphs.map((para, idx) => (
          <TranscriptParagraph key={idx} text={para} inProgress={false} />
        ))}
        {(currentParagraph || currentInterim) && (
          <TranscriptParagraph
            text={(currentParagraph + currentInterim).trim()}
            inProgress={true}
          />
        )}
      </div>
    </div>
  );
};
