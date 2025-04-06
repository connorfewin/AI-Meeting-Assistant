import React from "react";
import ReactMarkdown from "react-markdown";

export const TranscriptParagraph = ({ id, text, hoverId, setHoverId, hoverEnabled }) => {
  const isActive = id ? hoverId === id : false;
  return (
    <div
      className={`lecture-paragraph ${isActive ? "active" : ""}`}
      onMouseEnter={() => {
        if (hoverEnabled) setHoverId(id);
      }}
      onMouseLeave={() => {
        if (hoverEnabled) setHoverId(null);
      }}
    >
      <ReactMarkdown>{text}</ReactMarkdown>
    </div>
  );
};
