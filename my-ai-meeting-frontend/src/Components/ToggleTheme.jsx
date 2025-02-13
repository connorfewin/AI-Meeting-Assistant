// src/Components/ToggleTheme.js
import React, { useState, useEffect } from "react";
// Optionally import icons from a library like react-icons
import { FaSun, FaMoon } from "react-icons/fa";

export const ToggleTheme = () => {
  // Track whether we are in dark mode (true) or light mode (false)
  const [isDark, setIsDark] = useState(true);

  // Whenever `isDark` changes, update the HTML attribute
  useEffect(() => {
    if (isDark) {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  return (
    <div className="toggle-theme" onClick={toggleTheme}>
      {isDark ? <FaSun size={24} /> : <FaMoon size={24} />}
    </div>
  );
};
