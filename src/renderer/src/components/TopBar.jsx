// src/renderer/src/components/TopBar.jsx
import { useState, useEffect, useMemo } from 'react';
import { useTheme } from '../context/theme';

function formatElapsedTime(seconds) {
  const total = Math.max(0, Math.floor(seconds));

  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  const pad = (n) => String(n).padStart(2, '0');

  return hours > 0
    ? `${pad(hours)}:${pad(minutes)}:${pad(secs)}`
    : `${pad(minutes)}:${pad(secs)}`;
}

export default function TopBar({ onHide }) {
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const { theme } = useTheme();

  const openSettings = () => {
    window.electronAPI.openSettings();
  };

  useEffect(() => {
    let interval = null;

    if (isRecording) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  const displayTime = useMemo(() => formatElapsedTime(seconds), [seconds]);

  const toggleRecording = () => {
    setIsRecording((prev) => {
      if (prev) {
        setSeconds(0);
        window.electronAPI.closeInterview(); // Stop session and close window
      } else {
        window.electronAPI.openInterview(); // Open interview window and start session
      }
      return !prev;
    });
  };

  const isDark = theme === 'dark';

  const containerClasses = `
    pointer-events-auto w-full max-w-[540px]
    backdrop-blur-md border rounded-3xl overflow-hidden
    transition-colors duration-200
    ${isDark
      ? 'bg-gray-900/90 border-gray-700/50 text-white'
      : 'bg-white/90 border-gray-200/60 text-gray-900 shadow-sm'}
  `;

  const recordBtnClasses = `
    flex items-center gap-2.5 px-4 py-1.5 rounded-lg text-sm font-medium
    transition-all duration-150 active:scale-[0.98]
    ${isRecording
      ? isDark
        ? 'bg-blue-600 hover:bg-red-700 text-white'
        : 'bg-blue-500 hover:bg-red-600 text-white'
      : isDark
      ? 'bg-gray-700/80 hover:bg-gray-600 text-gray-200'
      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}
  `;

  const secondaryBtnClasses = `
    flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium
    transition-all duration-150 active:scale-[0.98]
    ${isDark
      ? 'bg-gray-800/60 hover:bg-gray-700 text-gray-200'
      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}
  `;

  const kbdClasses = `
    text-xs px-2 py-0.5 rounded border font-mono
    ${isDark
      ? 'bg-gray-800 border-gray-600 text-gray-400'
      : 'bg-gray-200 border-gray-300 text-gray-600'}
  `;

  return (
    <div className={containerClasses}>
      <div className="px-5 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleRecording}
            className={recordBtnClasses}
            title={isRecording ? 'Stop recording' : 'Start recording'}
            aria-label={isRecording ? 'Stop recording' : 'Start recording'}
          >
            {isRecording ? (
              <>
                <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse flex-shrink-0" />
                <span className="tabular-nums font-mono tracking-tight">
                  {displayTime}
                </span>
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
                <span>Record</span>
              </>
            )}
          </button>

          <button type="button" className={secondaryBtnClasses}>
            Ask AI
            <kbd className={kbdClasses}>⌘K</kbd>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onHide}
            className={secondaryBtnClasses}
          >
            Hide
            <kbd className={kbdClasses}>⌘H</kbd>
          </button>

          <button
            type="button"
            className={`
              p-2 rounded-lg transition-colors
              ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}
            `}
            onClick={openSettings}
            title="Settings"
            aria-label="Open settings"
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}