// src/Components/LectureTranscript.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import RadioButtonCheckedIcon from "@mui/icons-material/RadioButtonChecked";
import YouTubeIcon from "@mui/icons-material/YouTube";
import CircularProgress from "@mui/material/CircularProgress";
import Tooltip from "@mui/material/Tooltip";
import { TranscriptParagraph } from "./TranscriptParagraph";
import "../Styles/transcript.css";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import { YoutubeModal } from "./YoutubeModal";

async function fetchAndSplitPunctuatedText(text) {
  const url = `${process.env.REACT_APP_SOCKET_URL}/api/punctuate`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    throw new Error(`Failed to punctuate text. Status: ${res.status}`);
  }

  const { punctuated } = await res.json();
  return (punctuated || text)
    .split("\n")
    .map((p) => p.trim())
    .filter(Boolean);
}

// Bullshit comment
export const LectureTranscript = ({
  lectureParagraphs,
  setLectureParagraphs,
  hoverId,
  setHoverId,
  hoverEnabled,
  setHoverEnabled,
  hoverSource,
  setHoverSource,
}) => {
  const [currentParagraph, setCurrentParagraph] = useState("");
  const [currentInterim, setCurrentInterim] = useState("");
  const [micOn, setMicOn] = useState(false);
  const [meetingOn, setMeetingOn] = useState(false);
  const [hoverMeeting, setHoverMeeting] = useState(false);
  const [youtubeModalOpen, setYoutubeModalOpen] = useState(false);
  const [youtubeLoading, setYoutubeLoading] = useState(false);

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
          setLectureParagraphs((prev) => [
            ...prev,
            { id: Date.now(), text: combined, loading: false },
          ]);
        }
      }, 2000);
    },
    [setLectureParagraphs]
  );

  const { stopRecording } = useSpeechRecognition(
    handleSpeechData,
    micOn,
    meetingOn,
    setMeetingOn
  );

  useEffect(() => {
    if (!currentParagraph && !currentInterim) {
      if (!hoverEnabled) {
        setHoverEnabled(true);
      }
    } else if (hoverEnabled) {
      setHoverEnabled(false);
    }
  }, [currentParagraph, currentInterim, hoverEnabled, setHoverEnabled]);

  useEffect(() => {
    if (transcriptDisplayRef.current) {
      if (hoverEnabled) setHoverEnabled(false);
      transcriptDisplayRef.current.scrollTo({
        top: transcriptDisplayRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [lectureParagraphs, currentParagraph, currentInterim]);

  const toggleMic = () => setMicOn((prev) => !prev);
  const toggleMeeting = () => setMeetingOn((prev) => !prev);

  useEffect(() => {
    if (!micOn && !meetingOn) {
      stopRecording();
    }
  }, [micOn, meetingOn, stopRecording]);

  const handleYoutubeTranscript = (transcriptArray) => {
    setYoutubeLoading(true);
    const transcriptText = transcriptArray.map((part) => part.text).join(" ");
    fetchAndSplitPunctuatedText(transcriptText)
      .then((splittedParagraphs) => {
        setLectureParagraphs((prev) => [
          ...prev,
          ...splittedParagraphs.map((paraText, idx) => ({
            id: `${Date.now()}-yt-${idx}`,
            text: paraText,
          })),
        ]);
      })
      .catch((err) => {
        console.error("Error processing YouTube transcript:", err);
        alert("Error processing transcript");
      })
      .finally(() => {
        setYoutubeLoading(false);
      });
  };

  return (
    <div className="transcript-container">
      <div className="transcript-header">
        <h1 className="transcript-title">Lecture Transcript</h1>
        <div className="controls">
          <Tooltip title="Import from YouTube">
            <div className="youtube-icon" onClick={() => setYoutubeModalOpen(true)}>
              <YouTubeIcon />
            </div>
          </Tooltip>
          <Tooltip title={!meetingOn ? "Record Video" : "Stop Recording"}>
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
          </Tooltip>
          <Tooltip title={micOn ? "Turn Mic Off" : "Turn Mic On"}>
            <div className="mic-icon" onClick={toggleMic}>
              {micOn ? <MicIcon /> : <MicOffIcon />}
            </div>
          </Tooltip>
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
            hoverSource={hoverSource}
            setHoverSource={setHoverSource}
          />
        ))}

        {youtubeLoading && (
          <div className="loading-indicator" style={{ textAlign: "center", margin: "2rem 0" }}>
            <CircularProgress size={60} />
          </div>
        )}

        {(currentParagraph || currentInterim) && (
          <TranscriptParagraph
            text={(currentParagraph + currentInterim).trim()}
            hoverId={hoverId}
            setHoverId={setHoverId}
            hoverEnabled={hoverEnabled}
            hoverSource={hoverSource}
            setHoverSource={setHoverSource}
          />
        )}
      </div>

      <YoutubeModal
        open={youtubeModalOpen}
        onClose={() => setYoutubeModalOpen(false)}
        onSuccess={handleYoutubeTranscript}
      />
    </div>
  );
};
