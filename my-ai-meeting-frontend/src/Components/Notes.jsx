import React, { useState, useEffect } from "react";
import ReactDOMServer from "react-dom/server";
import ReactMarkdown from "react-markdown";
import "../Styles/notes.css";
import { SummaryParagraph } from "./SummaryParagraph";
import CachedIcon from '@mui/icons-material/Cached';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Tooltip from '@mui/material/Tooltip';

export const Notes = ({
  lectureParagraphs,
  hoverId,
  setHoverId,
  hoverEnabled,
  hoverSource,
  setHoverSource
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [summaryParagraphs, setSummaryParagraphs] = useState([]);
  const [progress, setProgress] = useState(0);
  const [totalNewParagraphs, setTotalNewParagraphs] = useState(0);
  const [regenerationCounter, setRegenerationCounter] = useState(0);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    const summarizeLectureParagraphs = async () => {
      const summarizedIds = new Set(summaryParagraphs.map((p) => p.id));
      const newParagraphs = lectureParagraphs.filter(
        (para) => !summarizedIds.has(para.id)
      );
      if (newParagraphs.length === 0) return;

      setIsLoading(true);
      setProgress(0);
      setTotalNewParagraphs(newParagraphs.length);

      try {
        const newSummaries = await Promise.all(
          newParagraphs.map(async (para) => {
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
            setProgress((prev) => prev + 1);
            return { id: para.id, text: summaryText, summarized: true };
          })
        );

        setSummaryParagraphs((prev) => [...prev, ...newSummaries]);
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
  }, [lectureParagraphs, regenerationCounter]);

  const handleRegenerate = () => {
    setSummaryParagraphs([]);
    setRegenerationCounter((prev) => prev + 1);
  };

  const handleCopyToClipboard = () => {
    const markdownText = summaryParagraphs.map((para) => para.text).join("\n\n");
    const htmlText = ReactDOMServer.renderToStaticMarkup(
      <ReactMarkdown>{markdownText}</ReactMarkdown>
    );
    const blobHTML = new Blob([htmlText], { type: "text/html" });
    const blobText = new Blob([markdownText], { type: "text/plain" });
    const clipboardItem = new ClipboardItem({
      "text/html": blobHTML,
      "text/plain": blobText,
    });

    navigator.clipboard.write([clipboardItem])
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch((err) => console.error("Failed to copy notes:", err));
  };

  return (
    <div className="notes-container">
      <div className="notes-header">
        <h1 className="notes-title">Notes</h1>
        <div className="controls">
          <Tooltip title="Copy Notes">
            <div className="copy-icon" onClick={handleCopyToClipboard}>
              {copySuccess ? <CheckCircleIcon className="copy-check" /> : <ContentCopyIcon />}
            </div>
          </Tooltip>
          <Tooltip title="Regenerate Notes">
            <div className="regenerate-icon" onClick={handleRegenerate}>
              <CachedIcon />
            </div>
          </Tooltip>
        </div>
      </div>
      <div className="notes-display">
        {summaryParagraphs.map((para) => (
          <SummaryParagraph
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
