// src/Components/SummaryParagraph.jsx
import React from "react";
import ReactMarkdown from "react-markdown";
import "../Styles/paragraph.css";

export const SummaryParagraph = ({ id, text, hoverId, setHoverId, hoverEnabled }) => {
  const isActive = hoverId === id;

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
