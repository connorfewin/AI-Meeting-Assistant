// src/Components/SummaryParagraph.jsx
import React, { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import "../Styles/paragraph.css";

export const SummaryParagraph = ({ id, text, hoverId, setHoverId, hoverEnabled, hoverSource, setHoverSource }) => {
  const isActive = hoverId === id;
  const paragraphRef = useRef(null);

  useEffect(() => {
    if (hoverEnabled && isActive && hoverSource !== "notes" && paragraphRef.current) {
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
          setHoverSource("notes");
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
