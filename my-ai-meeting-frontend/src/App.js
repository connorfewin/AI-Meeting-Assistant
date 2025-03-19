// src/App.js
import React, { useEffect, useState } from "react";
import "./App.css";
import { Header } from "./Components/Header";
import { TheBrain } from "./Components/TheBrain";
import { Notes } from "./Components/Notes";
import { LectureTranscript } from "./Components/LectureTranscript";

function App() {
  
  const [lectureParagraphs, setLectureParagraphs] = useState([]); // each item: { id, text }

  useEffect(() => {console.log(lectureParagraphs.length)}, [lectureParagraphs]);

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
          <LectureTranscript lectureParagraphs={lectureParagraphs} setLectureParagraphs={setLectureParagraphs} />
        </div>
        <div className="panel notes">
          <Notes lectureParagraphs={lectureParagraphs}/>
        </div>
      </div>
    </div>
  );
}

export default App;
