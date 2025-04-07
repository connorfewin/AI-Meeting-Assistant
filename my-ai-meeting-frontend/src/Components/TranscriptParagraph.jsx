// src/Components/TranscriptParagraph.jsx
import React, { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";

export const TranscriptParagraph = ({ id, text, hoverId, setHoverId, hoverEnabled, hoverSource, setHoverSource }) => {
  const isActive = id ? hoverId === id : false;
  const paragraphRef = useRef(null);

  useEffect(() => {
    if (hoverEnabled && isActive && hoverSource !== "transcript" && paragraphRef.current) {
      paragraphRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [isActive, hoverSource, hoverEnabled]);

  return (
    <div
      ref={paragraphRef}
      className={`lecture-paragraph ${isActive ? "active" : ""}`}
      onMouseEnter={() => {
        if (hoverEnabled) {
          setHoverId(id);
          setHoverSource("transcript");
        }
      }}
      onMouseLeave={() => {
        if (hoverEnabled) setHoverId(null);
      }}
    >
      <ReactMarkdown>{text}</ReactMarkdown>
    </div>
  );
};
