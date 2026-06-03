import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('black-white');

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark', 'blue', 'blue-yellow', 'white-black', 'orange-green', 'black-red', 'yellow-blue', 'black-white');
    root.classList.add('black-white');
    localStorage.setItem('theme', 'black-white');

    // Update theme-color meta tag for mobile status bar/browser bar
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.name = 'theme-color';
      document.head.appendChild(metaThemeColor);
    }
    
    metaThemeColor.setAttribute('content', '#000000');
  }, []);

  const toggleTheme = () => {
    // Disabled
  };

  return (
    <ThemeContext.Provider value={{ theme: 'black-white', toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
