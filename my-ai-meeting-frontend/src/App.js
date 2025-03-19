// src/App.js
import React from "react";
import "./App.css";
import { Header } from "./Components/Header";
import { TheBrain } from "./Components/TheBrain";
import { Notes } from "./Components/Notes";
import { LectureTranscript } from "./Components/LectureTranscript";

function App() {
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
          <LectureTranscript />
        </div>
        <div className="panel notes">
          <Notes />
        </div>
      </div>
    </div>
  );
}

export default App;
