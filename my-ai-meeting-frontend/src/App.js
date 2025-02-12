import React from "react";
import "./App.css";
import { Brain } from "./Components/Brain";
import { Header } from "./Components/Header";
import { NoteTaker } from "./Components/NoteTaker";

function App() {
  return (
    <div className="App">
      <div className="header-container">
        <Header />
      </div>
      <div className="panel-container">
        <div className="panel note-taker">
          <NoteTaker />
        </div>
        <div className="panel brain">
          <Brain />
        </div>
      </div>
    </div>
  );
}

export default App;
