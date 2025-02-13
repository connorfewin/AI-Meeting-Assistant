import React from "react";
import { ToggleTheme } from "./ToggleTheme";
import "../Styles/header.css";

export const Header = () => {
  return (
    <header className="app-header">
      {/* Left side: stacked text */}
      <div className="header-text">
        <h1 className="app-title">AI Meeting Assistant</h1>
        <h2 className="app-subtitle">Streamline your meetings with AI-driven insights</h2>
      </div>

      {/* Right side: theme toggle button */}
      <ToggleTheme />
    </header>
  );
};
