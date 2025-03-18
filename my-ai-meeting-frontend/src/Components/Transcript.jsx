import React, { useEffect, useRef, useState, useCallback } from "react";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import GroupsIcon from "@mui/icons-material/Groups";
import { TranscriptParagraph } from "./TranscriptParagraph";
import "../Styles/transcript.css";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";

export const Transcript = () => {
  const [paragraphs, setParagraphs] = useState([]);
  const [currentParagraph, setCurrentParagraph] = useState("");
  const [currentInterim, setCurrentInterim] = useState("");
  const [micOn, setMicOn] = useState(false);
  const [meetingOn, setMeetingOn] = useState(false);

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

  const handleSpeechData = useCallback(({ transcript, isFinal }) => {
    if (isFinal) {
      setCurrentParagraph((prev) => prev + transcript.trim() + " ");
      setCurrentInterim("");
    } else {
      setCurrentInterim(transcript);
    }
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    pauseTimerRef.current = setTimeout(() => {
      const combined = (currentParagraphRef.current + currentInterimRef.current).trim();
      if (combined) {
        setParagraphs((p) => [...p, combined]);
        setCurrentParagraph("");
        setCurrentInterim("");
      }
    }, 2000);
  }, []);

  const { stopRecording } = useSpeechRecognition(handleSpeechData, micOn, meetingOn, setMeetingOn);

  useEffect(() => {
    if (transcriptDisplayRef.current) {
      transcriptDisplayRef.current.scrollTo({ top: transcriptDisplayRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [paragraphs, currentParagraph, currentInterim]);

  const toggleMic = () => setMicOn((prev) => !prev);
  const toggleMeeting = () => setMeetingOn((prev) => !prev);

  useEffect(() => {
    if (!micOn && !meetingOn) {
      stopRecording();
    }
  }, [micOn, meetingOn, stopRecording]);

  return (
    <div className="transcript-container">
      <div className="transcript-header">
        <h1 className="transcript-title">Transcript</h1>
        <div className="controls">
          <div className={`meeting-icon ${meetingOn ? "active" : "disabled"}`} onClick={toggleMeeting}>
            <GroupsIcon />
          </div>
          <div className="mic-icon" onClick={toggleMic}>
            {micOn ? <MicIcon /> : <MicOffIcon />}
          </div>
        </div>
      </div>
      <div className="transcript-display" ref={transcriptDisplayRef}>
        {paragraphs.map((para, i) => (
          <TranscriptParagraph key={i} text={para} inProgress={false} />
        ))}
        {(currentParagraph || currentInterim) && (
          <TranscriptParagraph text={(currentParagraph + currentInterim).trim()} inProgress={true} />
        )}
      </div>
    </div>
  );
};
