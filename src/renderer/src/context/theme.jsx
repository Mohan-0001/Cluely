// // src/context/ThemeContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext({
  theme: 'light',
  setTheme: () => console.warn('setTheme used outside ThemeProvider'),
});

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside ThemeProvider');
  return context;
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState('light');

  // 1. Load initial theme from main process (One-time)
  useEffect(() => {
    const load = async () => {
      try {
        const saved = await window.electronAPI?.getTheme?.();
        if (saved && ['light', 'dark'].includes(saved)) {
          setThemeState(saved);
        }
      } catch (err) {
        console.warn('Failed to load initial theme:', err);
      }
    };
    load();
  }, []);

  // 2. Listen for theme changes from main process (broadcast from other windows)
  useEffect(() => {
    const unsubscribe = window.electronAPI?.onThemeUpdated?.((newTheme) => {
      if (['light', 'dark'].includes(newTheme)) {
        setThemeState(newTheme);
      }
    });
    return () => { if (typeof unsubscribe === 'function') unsubscribe(); };
  }, []);

  // 3. Apply Tailwind dark class
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // 4. Wrapped setTheme to persist to main process
  const setTheme = (newTheme) => {
    setThemeState(newTheme);
    if (window.electronAPI?.setTheme) {
      window.electronAPI.setTheme(newTheme);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}