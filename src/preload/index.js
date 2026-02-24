const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // ── Actions ────────────────────────────────────────────────────────────────
  openSettings: () => ipcRenderer.send('open-settings'),
  openInterview: () => ipcRenderer.send('open-interview'),
  closeInterview: () => ipcRenderer.send('close-interview'),
  closeSettings: () => ipcRenderer.send('close-settings-window'),
  setTheme: (theme) => ipcRenderer.send('set-theme', theme),
  getTheme: () => ipcRenderer.invoke('get-theme'),
  setDeepgramApiKey: (key) => ipcRenderer.send('set-deepgram-api-key', key),
  getDeepgramApiKey: () => ipcRenderer.invoke('get-deepgram-api-key'),
  setGroqApiKey: (key) => ipcRenderer.send('set-groq-api-key', key),
  getGroqApiKey: () => ipcRenderer.invoke('get-groq-api-key'),
  sendAudioData: (buffer) => ipcRenderer.send('audio-data', buffer),

  // ── Listeners (return a cleanup function) ──────────────────────────────────
  onWindowType: (callback) => {
    const handler = (_, type) => callback(type);
    ipcRenderer.on('window-type', handler);
    return () => ipcRenderer.removeListener('window-type', handler);
  },
  onThemeUpdated: (callback) => {
    const handler = (_, theme) => callback(theme);
    ipcRenderer.on('theme-updated', handler);
    return () => ipcRenderer.removeListener('theme-updated', handler);
  },
  onConnectionStatus: (callback) => {
    const handler = (_, status) => callback(status);
    ipcRenderer.on('connection-status', handler);
    return () => ipcRenderer.removeListener('connection-status', handler);
  },
  onNewTranscript: (callback) => {
    const handler = (_, data) => callback(data);
    ipcRenderer.on('new-transcript', handler);
    return () => ipcRenderer.removeListener('new-transcript', handler);
  },
  onInterimTranscript: (callback) => {
    const handler = (_, data) => callback(data);
    ipcRenderer.on('interim-transcript', handler);
    return () => ipcRenderer.removeListener('interim-transcript', handler);
  },
  onAiAnswerChunk: (callback) => {
    const handler = (_, chunk) => callback(chunk);
    ipcRenderer.on('ai-answer-chunk', handler);
    return () => ipcRenderer.removeListener('ai-answer-chunk', handler);
  },
  onAiAnswerComplete: (callback) => {
    const handler = (_, success) => callback(success);
    ipcRenderer.on('ai-answer-complete', handler);
    return () => ipcRenderer.removeListener('ai-answer-complete', handler);
  },
  onSessionError: (callback) => {
    const handler = (_, msg) => callback(msg);
    ipcRenderer.on('session-error', handler);
    return () => ipcRenderer.removeListener('session-error', handler);
  }
});