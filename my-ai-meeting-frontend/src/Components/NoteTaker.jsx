import React, { useState } from "react";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import "../Styles/noteTaker.css";

export const NoteTaker = () => {
  const [isMicOn, setIsMicOn] = useState(true);

  const handleMicToggle = () => {
    setIsMicOn((prev) => !prev);
  };

  return (
    <div className="note-taker-container">
      <h1 className="note-taker-title">Note Taker</h1>

      {/* Icon in top right */}
      <div className="mic-icon" onClick={handleMicToggle}>
        {isMicOn ? <MicIcon /> : <MicOffIcon />}
      </div>
    </div>
  );
};
