import { useState, useEffect } from 'react';
import { useTheme } from '../context/theme';

export default function Settings() {
  const [apiKey, setApiKey] = useState('');
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    // Fetch persisted settings from main process
    const loadSettings = async () => {
      try {
        const storedKey = await window.electronAPI.getDeepgramApiKey();
        if (storedKey) setApiKey(storedKey);
      } catch (err) {
        console.error('Failed to load settings:', err);
      }
    };
    loadSettings();
  }, []);

  const handleSaveApiKey = () => {
    console.log('Saving Deepgram API key:', apiKey);
    window.electronAPI.setDeepgramApiKey(apiKey);
  };

  const isDark = theme === 'dark';

  const handleClose = () => {
    window.electronAPI.closeSettings?.();
  };

  return (
    <div
      className={`
        min-h-screen p-5 pb-8
        backdrop-blur-xl backdrop-saturate-150
        border border-opacity-40
        shadow-2xl
        transition-colors duration-300
        ${isDark
          ? 'bg-gray-900/90 border-gray-200/15 text-white'
          : 'bg-white/90 border-gray-300/90 text-gray-900'
        }
        rounded-3xl          /* ← this now shapes the visible window */
        overflow-hidden      /* prevents children from bleeding outside radius */
      `}
    >
      {/* Close Button */}
      <button
        onClick={handleClose}
        className={`
          absolute top-5 right-5 z-20
          flex h-9 w-9 items-center justify-center rounded-full
          transition-all duration-200
          active:scale-90 focus:outline-none focus:ring-2 focus:ring-blue-500/40
          ${isDark
            ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/70 hover:text-white'
            : 'bg-white/60 text-gray-600 hover:bg-gray-300/80 hover:text-gray-900'
          }
        `}
        aria-label="Close settings"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <h2 className="text-2xl font-semibold mb-8">Settings</h2>

      {/* API Key */}
      <div className="mb-8">
        <label htmlFor="deepgram-api" className="block text-sm font-medium mb-3">
          Deepgram API Key
        </label>
        <input
          id="deepgram-api"
          type="text"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          className={`w-full px-4 py-3 rounded-xl border transition-colors
            ${isDark
              ? 'bg-gray-800/60 border-gray-600/50 text-white placeholder-gray-400'
              : 'bg-white/70 border-gray-300/60 text-gray-900 placeholder-gray-500'
            } focus:outline-none focus:ring-2 focus:ring-blue-500/40`}
          placeholder="Enter your Deepgram API key"
        />
        <button
          onClick={handleSaveApiKey}
          className={`mt-4 px-6 py-2.5 rounded-xl font-medium text-sm transition-all
            ${isDark
              ? 'bg-blue-600/90 hover:bg-blue-700 text-white shadow-md shadow-blue-900/20'
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20'
            }`}
        >
          Save API Key
        </button>
      </div>

      {/* Theme Toggle */}
      <div className="mb-8">
        <label className="block text-sm font-medium mb-3">Theme</label>
        <div className="flex gap-4">
          <button
            onClick={() => setTheme('light')}
            className={`px-6 py-2.5 rounded-xl text-sm font-medium border transition-all
              ${theme === 'light'
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : isDark
                  ? 'bg-transparent border-gray-600/50 text-gray-300 hover:bg-gray-800/40'
                  : 'bg-transparent border-gray-300 text-gray-700 hover:bg-gray-100'
              }`}
          >
            Light
          </button>

          <button
            onClick={() => setTheme('dark')}
            className={`px-6 py-2.5 rounded-xl text-sm font-medium border transition-all
              ${theme === 'dark'
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : isDark
                  ? 'bg-transparent border-gray-600/50 text-gray-300 hover:bg-gray-800/40'
                  : 'bg-transparent border-gray-300 text-gray-700 hover:bg-gray-100'
              }`}
          >
            Dark
          </button>
        </div>
      </div>

      {/* Coming Soon */}
      <div>
        <p className="text-sm font-medium mb-2">Other Features</p>
        <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Coming soon...</p>
      </div>
    </div>
  );
}