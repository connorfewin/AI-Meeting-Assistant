// src/App.js
import React, { useEffect, useState } from "react";
import "./App.css";
import { Header } from "./Components/Header";
import { TheBrain } from "./Components/TheBrain";
import { Notes } from "./Components/Notes";
import { LectureTranscript } from "./Components/LectureTranscript";

function App() {
  const [lectureParagraphs, setLectureParagraphs] = useState([]); // each item: { id, text }
  const [hoverID, setHoverID] = useState(null);
  const [hoverEnabled, setHoverEnabled] = useState(false); // Toggle state for hover functionality

  useEffect(() => {
    console.log(lectureParagraphs.length);
  }, [lectureParagraphs]);

  return (
    <div className="App">
      <div className="header-container">
        <Header />
      </div>
      <div className="panel-container">
        {/* <div className="panel brain">
          <TheBrain />
        </div> */}
        <div className="panel transcript">
          <LectureTranscript
            lectureParagraphs={lectureParagraphs}
            setLectureParagraphs={setLectureParagraphs}
            hoverId={hoverID}
            setHoverId={setHoverID}
            hoverEnabled={hoverEnabled}
            setHoverEnabled={setHoverEnabled}
          />
        </div>
        <div className="panel notes">
          <Notes
            lectureParagraphs={lectureParagraphs}
            hoverId={hoverID}
            setHoverId={setHoverID}
            hoverEnabled={hoverEnabled}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
