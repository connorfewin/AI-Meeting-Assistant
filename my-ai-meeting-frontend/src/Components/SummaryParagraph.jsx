import React from "react";
import ReactMarkdown from "react-markdown";

export const SummaryParagraph = ({ text }) => {
  return (
    <div className="notes-paragraph">
      <ReactMarkdown>{text}</ReactMarkdown>
    </div>
  );
};
