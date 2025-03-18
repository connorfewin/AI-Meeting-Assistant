import React from "react";
import ReactMarkdown from "react-markdown";

export const TranscriptParagraph = ({ text, inProgress }) => {
  return (
    <div className="transcript-paragraph">
      <ReactMarkdown>{text}</ReactMarkdown>
    </div>
  );
};
