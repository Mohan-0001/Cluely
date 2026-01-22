const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openSettings: () => ipcRenderer.send('open-settings'),
  openInterview: () => ipcRenderer.send('open-interview'),
  closeInterview: () => ipcRenderer.send('close-interview'),
  setTheme: (theme) => ipcRenderer.send('set-theme', theme),
  getTheme: () => ipcRenderer.invoke('get-theme'),
  setDeepgramApiKey: (key) => ipcRenderer.send('set-deepgram-api-key', key),
  getDeepgramApiKey: () => ipcRenderer.invoke('get-deepgram-api-key'),
  setGroqApiKey: (key) => ipcRenderer.send('set-groq-api-key', key),
  getGroqApiKey: () => ipcRenderer.invoke('get-groq-api-key'),
  sendAudioData: (buffer) => ipcRenderer.send('audio-data', buffer),
  onWindowType: (callback) => ipcRenderer.on('window-type', (_, type) => callback(type)),
  onThemeUpdated: (callback) => ipcRenderer.on('theme-updated', (_, theme) => callback(theme)),
  onNewTranscript: (callback) => ipcRenderer.on('new-transcript', (_, data) => callback(data)),
  onInterimTranscript: (callback) => ipcRenderer.on('interim-transcript', (_, data) => callback(data)),
  onAiAnswerChunk: (callback) => ipcRenderer.on('ai-answer-chunk', (_, chunk) => callback(chunk)),
  onAiAnswerComplete: (callback) => ipcRenderer.on('ai-answer-complete', (_, success) => callback(success)),
  onConnectionStatus: (callback) => ipcRenderer.on('connection-status', (_, status) => callback(status)),
  closeSettings: () => ipcRenderer.send('close-settings-window')
});