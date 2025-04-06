// src/Components/LectureTranscript.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import RadioButtonCheckedIcon from "@mui/icons-material/RadioButtonChecked";
import { TranscriptParagraph } from "./TranscriptParagraph";
import "../Styles/transcript.css";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";

/** 
 * Helper function to fetch punctuated text from server, then split it into lectureParagraphs
 * @param {string} text - The raw, unpunctuated text
 * @returns {string[]} an array of split lectureParagraphs
 */
async function fetchAndSplitPunctuatedText(text) {
  const url = `${process.env.REACT_APP_SOCKET_URL}/api/punctuate`;
  // If REACT_APP_SOCKET_URL isn’t set or you’re on the same server, you can just do "/api/punctuate"

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    throw new Error(`Failed to punctuate text. Status: ${res.status}`);
  }

  const { punctuated } = await res.json();

  // Split the punctuated text by newline, trim, and filter out empty lines
  const splitted = (punctuated || text)
    .split("\n")
    .map((p) => p.trim())
    .filter(Boolean);

  return splitted;
}

export const LectureTranscript = ({ lectureParagraphs, setLectureParagraphs, hoverId, setHoverId, hoverEnabled, setHoverEnabled }) => {
  const [currentParagraph, setCurrentParagraph] = useState("");
  const [currentInterim, setCurrentInterim] = useState("");
  const [micOn, setMicOn] = useState(false);
  const [meetingOn, setMeetingOn] = useState(false);
  const [hoverMeeting, setHoverMeeting] = useState(false);

  const transcriptDisplayRef = useRef(null);
  const currentParagraphRef = useRef("");
  const currentInterimRef = useRef("");
  const pauseTimerRef = useRef(null);

  useEffect(() => {
    currentParagraphRef.current = currentParagraph;
    currentInterimRef.current = currentInterim;
  }, [currentParagraph, currentInterim]);

  const handleSpeechData = useCallback(
    ({ transcript, isFinal }) => {
      if (isFinal) {
        setCurrentParagraph((prev) => prev + transcript.trim() + " ");
        setCurrentInterim("");
      } else {
        setCurrentInterim(transcript);
      }

      clearTimeout(pauseTimerRef.current);

      pauseTimerRef.current = setTimeout(async () => {
        const combined = (currentParagraphRef.current + currentInterimRef.current).trim();
        if (!combined) return;

        // Clear the current text immediately
        setCurrentParagraph("");
        setCurrentInterim("");

        try {
          const splittedParagraphs = await fetchAndSplitPunctuatedText(combined);
          setLectureParagraphs((prev) => [
            ...prev,
            ...splittedParagraphs.map((paraText, idx) => ({
              id: `${Date.now()}-${idx}`,
              text: paraText,
            })),
          ]);
        } catch (error) {
          console.error("Error punctuating text:", error);
          // On error, simply append the combined text as a single paragraph
          setLectureParagraphs((prev) => [
            ...prev,
            { id: Date.now(), text: combined, loading: false },
          ]);
        }
      }, 2000);
    },
    [setLectureParagraphs]
  );

  // This hook manages the Google speech recognition WebSocket logic
  const { stopRecording } = useSpeechRecognition(
    handleSpeechData,
    micOn,
    meetingOn,
    setMeetingOn
  );

  useEffect(() => {
    if(currentParagraph === "" && currentInterim === "") {
        if (!hoverEnabled) {
          console.log("Enable Hover!")
          setHoverEnabled(true)
        }
    } else {
      if (hoverEnabled) {
        console.log("Disable Hover!");
        setHoverEnabled(false);
      }
    }
  }, [currentInterim, currentParagraph, hoverEnabled, setHoverEnabled]);

  // Scroll the transcript display to the bottom whenever lectureParagraphs change
  useEffect(() => {
    if (transcriptDisplayRef.current) {
      if(hoverEnabled) setHoverEnabled(false);
      transcriptDisplayRef.current.scrollTo({
        top: transcriptDisplayRef.current.scrollHeight,
        behavior: "smooth",
      });
    } 
  }, [lectureParagraphs, currentParagraph, currentInterim]);

  const toggleMic = () => setMicOn((prev) => !prev);
  const toggleMeeting = () => setMeetingOn((prev) => !prev);

  // If both mic & meeting are off, stop recording
  useEffect(() => {
    if (!micOn && !meetingOn) {
      stopRecording();
    }
  }, [micOn, meetingOn, stopRecording]);

  return (
    <div className="transcript-container">
      <div className="transcript-header">
        <h1 className="transcript-title">Lecture Transcript</h1>
        <div className="controls">
          <div
            className={`meeting-icon ${meetingOn ? "active" : "disabled"}`}
            onClick={toggleMeeting}
            onMouseEnter={() => setHoverMeeting(true)}
            onMouseLeave={() => setHoverMeeting(false)}
          >
            {hoverMeeting || meetingOn ? (
              <RadioButtonCheckedIcon />
            ) : (
              <RadioButtonUncheckedIcon />
            )}
          </div>
          <div className="mic-icon" onClick={toggleMic}>
            {micOn ? <MicIcon /> : <MicOffIcon />}
          </div>
        </div>
      </div>

      <div className="transcript-display" ref={transcriptDisplayRef}>
        {lectureParagraphs.map((para) => (
          <TranscriptParagraph
            key={para.id}
            id={para.id}
            text={para.text}
            hoverId={hoverId}
            setHoverId={setHoverId}
            hoverEnabled={hoverEnabled}
          />
        ))}

        {/* Show the interim paragraph if the user is still speaking */}
        {(currentParagraph || currentInterim) && (
          <TranscriptParagraph
            text={(currentParagraph + currentInterim).trim()}
            hoverId={hoverId}
            setHoverId={setHoverId}
            hoverEnabled={hoverEnabled}
          />
        )}
      </div>
    </div>
  );
};
