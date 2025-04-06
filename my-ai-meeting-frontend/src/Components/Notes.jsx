import React, { useState, useEffect } from "react";
import "../Styles/notes.css";
import { SummaryParagraph } from "./SummaryParagraph";

export const Notes = ({ lectureParagraphs }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [summaryParagraphs, setSummaryParagraphs] = useState([]); // each item: { id, text, summarized: true }
  const [progress, setProgress] = useState(0);
  const [totalNewParagraphs, setTotalNewParagraphs] = useState(0);

  useEffect(() => {
    const summarizeLectureParagraphs = async () => {
      // Create a Set of IDs for paragraphs already summarized.
      const summarizedIds = new Set(summaryParagraphs.map((p) => p.id));

      // Filter for only new paragraphs that haven't been summarized yet.
      const newParagraphs = lectureParagraphs.filter(
        (para) => !summarizedIds.has(para.id)
      );

      // If there are no new paragraphs, nothing to do.
      if (newParagraphs.length === 0) {
        return;
      }

      // Set up the progress tracker for just the new paragraphs.
      setIsLoading(true);
      setProgress(0);
      setTotalNewParagraphs(newParagraphs.length);

      console.log(`Starting summary for ${newParagraphs.length} new paragraph(s)`);

      try {
        const newSummaries = await Promise.all(
          newParagraphs.map(async (para) => {
            console.log(`Summarizing paragraph ID ${para.id}`);
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
            const summaryText = data.summary.content ? data.summary.content : data.summary;
            // Update progress for each summarized paragraph.
            setProgress((prev) => prev + 1);
            return { id: para.id, text: summaryText, summarized: true };
          })
        );

        // Append new summaries to the existing summaries.
        setSummaryParagraphs((prev) => [...prev, ...newSummaries]);
        console.log("New paragraphs summarized successfully");
      } catch (error) {
        console.error("Error summarizing lecture paragraphs:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (lectureParagraphs && lectureParagraphs.length > 0) {
      summarizeLectureParagraphs();
    } else {
      setSummaryParagraphs([]);
    }
  }, [lectureParagraphs]);

  return (
    <div className="notes-container">
      <div className="notes-header">
        <h1 className="notes-title">Notes</h1>
      </div>
      <div className="notes-display">
        {/* Always display summarized paragraphs */}
        {summaryParagraphs.map((para) => (
          <SummaryParagraph key={para.id} text={para.text} />
        ))}
        {/* If new paragraphs are being summarized, show a loading indicator below */}
        {isLoading && (
          <div className="loading-indicator">
            <p>
              Generating summaries for {totalNewParagraphs} new paragraph
              {totalNewParagraphs > 1 ? "s" : ""}...
            </p>
            <p>{`Progress: ${progress} / ${totalNewParagraphs}`}</p>
          </div>
        )}
      </div>
    </div>
  );
};
