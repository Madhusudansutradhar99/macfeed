import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark', 'blue', 'blue-yellow', 'white-black', 'orange-green', 'black-red', 'yellow-blue');
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
      dark: '#0A0A0F',
      light: '#eff6ff',
      blue: '#E0F2FE',
      'blue-yellow': '#3b82f6',
      'white-black': '#ffffff',
      'orange-green': '#f97316',
      'black-red': '#000000',
      'yellow-blue': '#eab308'
    };
    metaThemeColor.setAttribute('content', colors[theme] || colors.dark);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => {
      const allThemes = ['dark', 'light', 'blue-yellow', 'white-black', 'orange-green', 'black-red', 'yellow-blue'];
      const nextIdx = (allThemes.indexOf(prev) + 1) % allThemes.length;
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
