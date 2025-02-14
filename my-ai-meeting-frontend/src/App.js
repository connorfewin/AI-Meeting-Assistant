// src/App.js
import React from "react";
import "./App.css";
import { Header } from "./Components/Header";
import { NoteTaker } from "./Components/NoteTaker";
import { TheBrain } from "./Components/TheBrain";

function App() {
  return (
    <div className="App">
      <div className="header-container">
        <Header />
      </div>
      <div className="panel-container">
        <div className="panel brain">
          <TheBrain />
        </div>
        <div className="panel note-taker">
          <NoteTaker />
        </div>
      </div>
    </div>
  );
}

export default App;
