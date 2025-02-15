import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import "../Styles/brainParagraph.css";

export const BrainParagraph = ({ text, inProgress }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [answer, setAnswer] = useState(null);

  useEffect(() => {
    if (!inProgress) {
      setIsLoading(true);
      // Call the developer API
      fetch(`${process.env.REACT_APP_API_URL}/api/developer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      })
        .then((response) => response.json())
        .then((data) => {
          // Assuming the API now returns markdown in data.answer.content
          if (data.answer && data.answer.content) {
            setAnswer(data.answer.content);
          }
          setIsLoading(false);
        })
        .catch((err) => {
          console.error("Error processing developer question:", err);
          setIsLoading(false);
        });
    }
  }, [text, inProgress]);

  return (
    <div className="transcript-box">
      <p>
        <strong>Question: </strong>
        {text}
      </p>
      <div className="answer-window">
        {isLoading ? (
          <div className="skeleton">
            <div className="skeleton-line" />
            <div className="skeleton-line" />
            <div className="skeleton-line" />
          </div>
        ) : (
          answer && <ReactMarkdown>{answer}</ReactMarkdown>
        )}
      </div>
    </div>
  );
};
