import React, { useState, useEffect } from "react";
import { Moon, Sun } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import "./Header.css";

const Header = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const isDark = savedTheme === "dark" || 
      (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches);
    
    setIsDarkMode(isDark);
    if (isDark) {
      document.body.classList.add("dark-mode");
    }
  }, []);

  const toggleDarkMode = () => {
    if (isDarkMode) {
      document.body.classList.remove("dark-mode");
      localStorage.setItem("theme", "light");
      setIsDarkMode(false);
    } else {
      document.body.classList.add("dark-mode");
      localStorage.setItem("theme", "dark");
      setIsDarkMode(true);
    }
  };

  return (
    <header className="header-container">
       <div className="button-group">
       <button 
          className="nav-button dark-mode-btn" 
          title={isDarkMode ? "Light mode" : "Dark mode"}>
  
        </button>
       </div>
      <h1 className="logo">SoonManager</h1>

      <div className="button-group">
        <button 
          className="nav-button dark-mode-btn" 
          title={isDarkMode ? "Light mode" : "Dark mode"}
          onClick={toggleDarkMode}
        >
          {isDarkMode ? (
            <Sun size={20} strokeWidth={2} color="#ffcc00" />
          ) : (
            <Moon size={20} strokeWidth={2} />
          )}
        </button>
      </div>
    </header>
  );
};

export default Header;