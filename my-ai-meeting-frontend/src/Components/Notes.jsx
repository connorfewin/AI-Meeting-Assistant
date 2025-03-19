import React, { useState, useEffect } from "react";
import "../Styles/notes.css";
import { SummaryParagraph } from "./SummaryParagraph";

export const Notes = ({ lectureParagraphs }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [summaryParagraphs, setSummaryParagraphs] = useState([]); // each item: { id, text }
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const summarizeLectureParagraphs = async () => {
      setIsLoading(true);
      setProgress(0);
      console.log(
        "Starting summary process for",
        lectureParagraphs.length,
        "paragraph(s)"
      );

      try {
        const summaries = await Promise.all(
          lectureParagraphs.map(async (para) => {
            console.log(`Starting summary for paragraph ID ${para.id}`);
            const url = `${process.env.REACT_APP_SOCKET_URL}/api/summarize`;
            const response = await fetch(url, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text: para.text }),
            });
            if (!response.ok) {
              throw new Error(
                `Summarize failed for paragraph ${para.id}: ${response.status}`
              );
            }
            const data = await response.json();
            const summaryText = data.summary.content
              ? data.summary.content
              : data.summary;
            console.log(`Completed summary for paragraph ID ${para.id}`);
            setProgress((prev) => prev + 1);
            return { id: para.id, text: summaryText };
          })
        );
        setSummaryParagraphs(summaries);
        console.log("All paragraphs have been summarized");
      } catch (error) {
        console.error("Error summarizing lecture paragraphs:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (lectureParagraphs && lectureParagraphs.length > 0) {
      summarizeLectureParagraphs();
    } else {
      console.log("No lecture paragraphs available, clearing summaries");
      setSummaryParagraphs([]);
    }
  }, [lectureParagraphs]);

  return (
    <div className="notes-container">
      <div className="notes-header">
        <h1 className="notes-title">Notes</h1>
      </div>
      <div className="notes-display">
        {isLoading ? (
          <div className="loading-indicator">
            <p>Generating summaries...</p>
            <p>{`Progress: ${progress} / ${lectureParagraphs.length}`}</p>
          </div>
        ) : (
          summaryParagraphs.map((para) => (
            <SummaryParagraph key={para.id} text={para.text} />
          ))
        )}
      </div>
    </div>
  );
};
