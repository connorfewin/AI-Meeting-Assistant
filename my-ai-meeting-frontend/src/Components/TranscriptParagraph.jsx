import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";

export const TranscriptParagraph = ({ text, inProgress }) => {
    const [displayText, setDisplayText] = useState(null);

    useEffect(() => {
        // When the text is finalized and long enough (e.g. more than 2 periods)
        if (!inProgress) {
            // Call the summarization API
            fetch("http://localhost:5000/api/summarize", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ text }),
            })
                .then((response) => response.json())
                .then((data) => {
                    console.log(data);
                    if (data.summary.content) {
                        setDisplayText(data.summary.content);
                    }
                })
                .catch((err) => {
                    console.error("Error summarizing text:", err);
                });
        }
    }, [text, inProgress]);

    return (
        <div className="transcript-box">
            <ReactMarkdown>
                {displayText ? displayText : text}
            </ReactMarkdown>
        </div>
    );
};
