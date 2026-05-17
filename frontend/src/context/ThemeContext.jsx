import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'blue-yellow');

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark', 'blue', 'blue-yellow', 'white-black', 'orange-green', 'black-red', 'yellow-blue', 'black-white');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);

    // Update theme-color meta tag for mobile status bar/browser bar
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.name = 'theme-color';
      document.head.appendChild(metaThemeColor);
    }
    
    const colors = {
      'black-white': '#000000',
      'white-black': '#ffffff',
      'blue-yellow': '#E0F2FE'
    };
    metaThemeColor.setAttribute('content', colors[theme] || colors['black-white']);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => {
      const allThemes = ['black-white', 'white-black', 'blue-yellow'];
      let nextIdx = (allThemes.indexOf(prev) + 1) % allThemes.length;
      if (nextIdx < 0) nextIdx = 0;
      return allThemes[nextIdx];
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
