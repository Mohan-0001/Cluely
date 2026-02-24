// import { app, shell, BrowserWindow, ipcMain, screen, session, desktopCapturer } from 'electron';
// import { join } from 'path';
// import { electronApp, optimizer, is } from '@electron-toolkit/utils';
// import icon from '../../resources/icon.png?asset';
// import Store from 'electron-store';
// import dotenv from 'dotenv';
// import { createClient, LiveTranscriptionEvents } from '@deepgram/sdk';
// import Groq from 'groq-sdk';

// dotenv.config();

// const store = new Store();

// let mainWindow;
// let settingsWindow;
// let interviewWindow;
// let currentTheme = store.get('theme', 'light');
// let deepgramApiKey = store.get('deepgramApiKey', '');
// let groqApiKey = store.get('groqApiKey', '');

// let dgConnection = null;
// let keepAliveInterval = null;
// let shouldMaintainConnection = false;

// // Groq history
// let chatHistory = [
//   {
//     role: 'system',
//     content: `You are an elite Senior Staff Engineer and Lead Technical Interviewer. Mentor for top-tier roles.
// DSA: LeetCode Medium/Hard. Discuss complexity first.
// System Design: Scalability, DBs, security.
// Behavioral: STAR method.
// Tone: Professional, concise, rigorous.`
//   }
// ];

// let currentUtterance = '';
// let lastSpeaker = null;
// let interviewerContext = '';

// const speakerLabels = { 0: 'Interviewer', 1: 'You' };

// function createMainWindow() {
//   const { workArea } = screen.getPrimaryDisplay();
//   const windowWidth = 520;
//   const windowHeight = 65;

//   mainWindow = new BrowserWindow({
//     width: windowWidth,
//     height: windowHeight,
//     x: Math.round(workArea.x + (workArea.width - windowWidth) / 2),
//     y: workArea.y,
//     show: false,
//     frame: false,
//     transparent: true,
//     backgroundColor: '#00000001',
//     alwaysOnTop: true,
//     skipTaskbar: true,
//     resizable: true,
//     minimizable: false,
//     maximizable: false,
//     fullscreenable: false,
//     autoHideMenuBar: true,
//     titleBarStyle: 'hidden',
//     trafficLightPosition: { x: 10, y: 10 },
//     ...(process.platform === 'linux' ? { icon } : {}),
//     webPreferences: {
//       preload: join(__dirname, '../preload/index.js'),
//       sandbox: true,
//       contextIsolation: true,
//       nodeIntegration: false
//     }
//   });

//   mainWindow.on('ready-to-show', () => {
//     mainWindow.showInactive();
//     mainWindow.webContents.send('window-type', 'main');
//   });

//   mainWindow.webContents.setWindowOpenHandler((details) => {
//     shell.openExternal(details.url);
//     return { action: 'deny' };
//   });

//   if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
//     mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
//   } else {
//     mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
//   }
// }

// function createSettingsWindow() {
//   if (settingsWindow) {
//     settingsWindow.focus();
//     return;
//   }

//   const mainBounds = mainWindow.getBounds();
//   const settingsWidth = 510;
//   const settingsHeight = 440;

//   settingsWindow = new BrowserWindow({
//     width: settingsWidth,
//     height: settingsHeight,
//     x: mainBounds.x + (mainBounds.width / 2) - (settingsWidth / 2),
//     y: mainBounds.y + mainBounds.height + 10,
//     show: false,
//     frame: false,
//     transparent: true,
//     backgroundColor: '#00000001',
//     roundedCorners: true,
//     alwaysOnTop: true,
//     skipTaskbar: true,
//     resizable: false,
//     minimizable: false,
//     maximizable: false,
//     autoHideMenuBar: true,
//     title: 'Settings',
//     trafficLightPosition: { x: 12, y: 12 },
//     webPreferences: {
//       preload: join(__dirname, '../preload/index.js'),
//       sandbox: true,
//       contextIsolation: true,
//       nodeIntegration: false
//     }
//   });

//   settingsWindow.on('closed', () => { settingsWindow = null; });

//   settingsWindow.on('ready-to-show', () => {
//     settingsWindow.show();
//     settingsWindow.webContents.send('window-type', 'settings');
//   });

//   if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
//     settingsWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/settings`);
//   } else {
//     settingsWindow.loadFile(join(__dirname, '../renderer/index.html'), { hash: '/settings' });
//   }
// }

// function createInterviewWindow() {
//   if (interviewWindow) {
//     interviewWindow.focus();
//     return;
//   }

//   const mainBounds = mainWindow.getBounds();
//   interviewWindow = new BrowserWindow({
//     width: 800,
//     height: 600,
//     x: mainBounds.x + (mainBounds.width / 2) - 400,
//     y: mainBounds.y + mainBounds.height + 10,
//     show: false,
//     frame: false,
//     transparent: true,
//     backgroundColor: '#00000001',
//     roundedCorners: true,
//     alwaysOnTop: true,
//     skipTaskbar: true,
//     resizable: true,
//     minimizable: false,
//     maximizable: false,
//     autoHideMenuBar: true,
//     title: 'Interview Assistant',
//     webPreferences: {
//       preload: join(__dirname, '../preload/index.js'),
//       sandbox: true,
//       contextIsolation: true,
//       nodeIntegration: false
//     }
//   });

//   interviewWindow.on('closed', () => {
//     interviewWindow = null;
//     stopSession();
//   });

//   interviewWindow.on('ready-to-show', () => {
//     interviewWindow.show();
//     interviewWindow.webContents.send('window-type', 'interview');
//   });

//   if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
//     interviewWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/interview`);
//   } else {
//     interviewWindow.loadFile(join(__dirname, '../renderer/index.html'), { hash: '/interview' });
//   }
// }

// function initDeepgramConnection() {
//   if (!deepgramApiKey) {
//     console.error('[Deepgram] API key missing');
//     if (interviewWindow) interviewWindow.webContents.send('session-error', 'Deepgram API key not set');
//     return;
//   }

//   if (dgConnection && dgConnection.getReadyState() === 1) {
//     console.log('[Deepgram] Already connected — skipping');
//     return;
//   }

//   console.log('[Deepgram] Creating stable live connection...');

//   const deepgram = createClient(process.env.DEEPGRAM_API_KEY || deepgramApiKey);

//   dgConnection = deepgram.listen.live({
//     model: 'nova-2',
//     language: 'hi',
//     smart_format: true,
//     interim_results: true,
//     endpointing: 1200,
//     utterances: true,
//     diarize: true,
//     keepalive: true,
//     encoding: 'linear16',
//     sample_rate: 16000,
//     channels: 1,
//     no_delay: true,
//     utterance_end_ms: 2500,
//     filler_words: false, // Remove um/ah for precision
//     punctuation: true // Better sentence structure
//   });

//   dgConnection.on(LiveTranscriptionEvents.Open, () => {
//     console.log('[Deepgram] Connection OPENED and now stable');
//     if (interviewWindow) interviewWindow.webContents.send('connection-status', 'connected');

//     if (keepAliveInterval) clearInterval(keepAliveInterval);
//     keepAliveInterval = setInterval(() => {
//       if (dgConnection?.getReadyState() === 1) {
//         dgConnection.keepAlive();
//         // Send 200ms silence packet to prevent timeout
//         const silence = new Uint8Array(6400);
//         dgConnection.send(silence);
//         console.log('[Deepgram] Sent keepalive + silence packet');
//       }
//     }, 2000);
//   });

//   dgConnection.on(LiveTranscriptionEvents.Transcript, (data) => {
//     const alt = data.channel?.alternatives?.[0];
//     const text = alt?.transcript?.trim();
//     if (!text) return;

//     const speaker = alt.words?.[0]?.speaker ?? lastSpeaker ?? 0;
//     lastSpeaker = speaker;
//     const label = speakerLabels[speaker] || `Speaker ${speaker}`;

//     if (data.is_final) {
//       currentUtterance += (currentUtterance ? ' ' : '') + text;
//       if (label === 'Interviewer') interviewerContext += (interviewerContext ? ' ' : '') + text;
//       if (interviewWindow) interviewWindow.webContents.send('new-transcript', { text, speaker: label, isFinal: true });
//     } else {
//       currentUtterance = text;
//       if (interviewWindow) interviewWindow.webContents.send('interim-transcript', { text, speaker: label });
//     }
//   });

//   let lastUtteranceTime = 0;
//   dgConnection.on(LiveTranscriptionEvents.UtteranceEnd, () => {
//     const now = Date.now();
//     if (now - lastUtteranceTime < 400) return;
//     lastUtteranceTime = now;

//     if (!currentUtterance.trim()) return;

//     const label = speakerLabels[lastSpeaker] || 'Unknown';
//     const isQuestion = currentUtterance.trim().endsWith('?') ||
//       /(what|how|why|where|when|who|which|can|could|would|should|tell|explain|describe)/i.test(currentUtterance);

//     if (label === 'Interviewer' && isQuestion) {
//       const full = (interviewerContext + ' ' + currentUtterance).trim();
//       chatHistory.push({ role: 'user', content: full });
//       if (interviewWindow) interviewWindow.webContents.send('ai-answer-chunk', '[clear]');
//       triggerGroqResponse();
//       interviewerContext = '';
//     }

//     currentUtterance = '';
//     if (interviewWindow) interviewWindow.webContents.send('interim-transcript', { text: '', speaker: null });
//   });

//   dgConnection.on(LiveTranscriptionEvents.Error, (err) => {
//     console.error('[Deepgram] Error:', err);
//   });

//   dgConnection.on(LiveTranscriptionEvents.Close, (code, reason) => {
//     console.log(`[Deepgram] Closed (code: ${code}, reason: ${reason || 'unknown'})`);
//     if (keepAliveInterval) clearInterval(keepAliveInterval);
//     dgConnection = null;

//     if (interviewWindow) interviewWindow.webContents.send('connection-status', 'disconnected');

//     if (shouldMaintainConnection) {
//       console.log('[Deepgram] Reconnecting in 5s...');
//       setTimeout(initDeepgramConnection, 5000);
//     }
//   });
// }

// async function triggerGroqResponse() {
//   if (!interviewWindow || !groqApiKey) return;

//   const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || groqApiKey });

//   try {
//     const stream = await groq.chat.completions.create({
//       messages: chatHistory,
//       model: 'llama-3.1-8b-instant',
//       stream: true,
//       temperature: 0.7
//     });

//     let answer = '';
//     for await (const chunk of stream) {
//       const delta = chunk.choices[0]?.delta?.content || '';
//       answer += delta;
//       interviewWindow.webContents.send('ai-answer-chunk', delta);
//     }

//     interviewWindow.webContents.send('ai-answer-complete', true);
//     chatHistory.push({ role: 'assistant', content: answer.trim() });
//   } catch (err) {
//     console.error('[Groq] Error:', err);
//     interviewWindow.webContents.send('ai-answer-chunk', '\n[AI Error]');
//     interviewWindow.webContents.send('ai-answer-complete', false);
//   }
// }

// function stopSession() {
//   shouldMaintainConnection = false;

//   if (dgConnection) {
//     console.log('[Session] Closing Deepgram...');
//     dgConnection.finish();
//     dgConnection = null;
//   }

//   if (keepAliveInterval) clearInterval(keepAliveInterval);

//   chatHistory = [chatHistory[0]];
//   currentUtterance = '';
//   interviewerContext = '';
//   lastSpeaker = null;
// }

// app.whenReady().then(() => {
//   electronApp.setAppUserModelId('com.yourname.meeting-overlay');

//   app.on('browser-window-created', (_, window) => {
//     optimizer.watchWindowShortcuts(window);
//   });

//   ipcMain.on('open-settings', createSettingsWindow);

//   ipcMain.on('close-settings-window', () => {
//     if (settingsWindow && !settingsWindow.isDestroyed()) settingsWindow.close();
//   });

//   ipcMain.on('open-interview', () => {
//     shouldMaintainConnection = true;
//     createInterviewWindow();
//     initDeepgramConnection();
//   });

//   ipcMain.on('close-interview', () => {
//     if (interviewWindow && !interviewWindow.isDestroyed()) interviewWindow.close();
//     stopSession();
//   });

//   ipcMain.on('set-theme', (_, theme) => {
//     currentTheme = theme;
//     store.set('theme', theme);
//     BrowserWindow.getAllWindows().forEach((win) => win.webContents.send('theme-updated', theme));
//   });

//   ipcMain.handle('get-theme', () => currentTheme);

//   ipcMain.handle('get-deepgram-api-key', () => deepgramApiKey);

//   ipcMain.on('set-deepgram-api-key', (_, key) => {
//     deepgramApiKey = key;
//     store.set('deepgramApiKey', key);
//   });

//   ipcMain.on('set-groq-api-key', (_, key) => {
//     groqApiKey = key;
//     store.set('groqApiKey', key);
//   });

//   ipcMain.handle('get-groq-api-key', () => groqApiKey);

//   ipcMain.on('audio-data', (_, buffer) => {
//     if (dgConnection && dgConnection.getReadyState() === 1) {
//       dgConnection.send(Buffer.from(buffer));
//     }
//   });

//   if (process.platform === 'darwin') {
//     app.commandLine.appendSwitch('enable-features', 'MacLoopbackAudioForScreenShare,MacCaptureSystemAudioLoopbackCapture');
//   }

//   session.defaultSession.setDisplayMediaRequestHandler((request, callback) => {
//     desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: 1, height: 1 } }).then((sources) => {
//       callback({
//         video: sources[0],
//         audio: 'loopback',
//         enableLocalEcho: false
//       });
//     });
//   });

//   createMainWindow();

//   app.on('activate', () => {
//     if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
//   });
// });

// app.on('window-all-closed', () => {
//   stopSession();
//   if (process.platform !== 'darwin') app.quit();
// });
























import { app, shell, BrowserWindow, ipcMain, screen, session, desktopCapturer } from 'electron';
import { join } from 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import icon from '../../resources/icon.png?asset';
import Store from 'electron-store';
import dotenv from 'dotenv';
import { createClient, LiveTranscriptionEvents } from '@deepgram/sdk';
import Groq from 'groq-sdk';

dotenv.config();

const store = new Store();

let mainWindow;
let settingsWindow;
let interviewWindow;
let currentTheme = store.get('theme', 'light');
let deepgramApiKey = store.get('deepgramApiKey', '');
let groqApiKey = store.get('groqApiKey', '');

let dgConnection = null;
let keepAliveInterval = null;
let shouldMaintainConnection = false;

// Groq history
let chatHistory = [
  {
    role: 'system',
    content: `You are an elite Senior Staff Engineer and Lead Technical Interviewer. Mentor for top-tier roles.
DSA: LeetCode Medium/Hard. Discuss complexity first.
System Design: Scalability, DBs, security.
Behavioral: STAR method.
Tone: Professional, concise, rigorous.`
  }
];

let currentUtterance = '';
let lastSpeaker = null;
let interviewerContext = '';

const speakerLabels = { 0: 'Interviewer', 1: 'You' };

function createMainWindow() {
  const { workArea } = screen.getPrimaryDisplay();
  const windowWidth = 520;
  const windowHeight = 65;

  mainWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    x: Math.round(workArea.x + (workArea.width - windowWidth) / 2),
    y: workArea.y,
    show: false,
    frame: false,
    transparent: true,
    backgroundColor: '#00000001',
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: true,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    autoHideMenuBar: true,
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 10, y: 10 },
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow.showInactive();
    mainWindow.webContents.send('window-type', 'main');
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

function createSettingsWindow() {
  if (settingsWindow) {
    settingsWindow.focus();
    return;
  }

  const mainBounds = mainWindow.getBounds();
  const settingsWidth = 510;
  const settingsHeight = 440;

  settingsWindow = new BrowserWindow({
    width: settingsWidth,
    height: settingsHeight,
    x: mainBounds.x + (mainBounds.width / 2) - (settingsWidth / 2),
    y: mainBounds.y + mainBounds.height + 10,
    show: false,
    frame: false,
    transparent: true,
    backgroundColor: '#00000001',
    roundedCorners: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    minimizable: false,
    maximizable: false,
    autoHideMenuBar: true,
    title: 'Settings',
    trafficLightPosition: { x: 12, y: 12 },
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  settingsWindow.on('closed', () => { settingsWindow = null; });

  settingsWindow.on('ready-to-show', () => {
    settingsWindow.show();
    settingsWindow.webContents.send('window-type', 'settings');
  });

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    settingsWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/settings`);
  } else {
    settingsWindow.loadFile(join(__dirname, '../renderer/index.html'), { hash: '/settings' });
  }
}

function createInterviewWindow() {
  if (interviewWindow) {
    interviewWindow.focus();
    return;
  }

  const mainBounds = mainWindow.getBounds();
  interviewWindow = new BrowserWindow({
    width: 800,
    height: 600,
    x: mainBounds.x + (mainBounds.width / 2) - 400,
    y: mainBounds.y + mainBounds.height + 10,
    show: false,
    frame: false,
    transparent: true,
    backgroundColor: '#00000001',
    roundedCorners: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: true,
    minimizable: false,
    maximizable: false,
    autoHideMenuBar: true,
    title: 'Interview Assistant',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  interviewWindow.on('closed', () => {
    interviewWindow = null;
    stopSession();
  });

  interviewWindow.on('ready-to-show', () => {
    interviewWindow.show();
    interviewWindow.webContents.send('window-type', 'interview');
  });

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    interviewWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/interview`);
  } else {
    interviewWindow.loadFile(join(__dirname, '../renderer/index.html'), { hash: '/interview' });
  }
}

function initDeepgramConnection() {
  if (!deepgramApiKey) {
    console.error('[Deepgram] API key missing');
    if (interviewWindow) interviewWindow.webContents.send('session-error', 'Deepgram API key not set');
    return;
  }

  if (dgConnection && dgConnection.getReadyState() === 1) {
    console.log('[Deepgram] Already connected — skipping');
    return;
  }

  console.log('[Deepgram] Creating stable live connection...');

  const deepgram = createClient(process.env.DEEPGRAM_API_KEY || deepgramApiKey);

  dgConnection = deepgram.listen.live({
    model: 'nova-2-general',  // Try this for better diarization; fallback to 'nova-2' if issues
    language: 'en-IN',
    smart_format: true,
    interim_results: true,
    endpointing: 800,
    utterances: true,
    diarize: true,
    vad_events: true,
    encoding: 'linear16',
    sample_rate: 16000,
    channels: 1,  // Try 2 if your audio source supports stereo for better diarization
    no_delay: true,
    utterance_end_ms: 4000,  // Increased to group more, encourage Ends
    filler_words: false,
    punctuation: true
  });

  let debounceTimer = null;
  const debounceDelay = 1500;  // Lowered for faster triggers in continuous speech
  let lastActivityTime = 0;

  dgConnection.on(LiveTranscriptionEvents.Open, () => {
    console.log('[Deepgram] Connection OPENED and now stable');
    if (interviewWindow) interviewWindow.webContents.send('connection-status', 'connected');

    if (keepAliveInterval) clearInterval(keepAliveInterval);
    keepAliveInterval = setInterval(() => {
      if (dgConnection?.getReadyState() === 1) {
        dgConnection.keepAlive();
        console.log('[Deepgram] Sent keepalive');
      }
    }, 5000);
  });

  dgConnection.on(LiveTranscriptionEvents.Transcript, (data) => {
    const alt = data.channel?.alternatives?.[0];
    const text = alt?.transcript?.trim();
    if (!text) return;

    let speaker = alt.words?.[0]?.speaker ?? lastSpeaker ?? 0;
    // Stabilize speaker: If previous was Interviewer and text looks like continuation/question, keep as Interviewer
    if (lastSpeaker === 0 && /(what|how|why|where|when|who|which|can|could|would|should|tell|explain|describe|is|do|does)/i.test(text)) {
      speaker = 0;  // Force Interviewer for question-like flips
    }
    lastSpeaker = speaker;
    const label = speakerLabels[speaker] || `Speaker ${speaker}`;

    lastActivityTime = Date.now();

    console.log(`[Transcript] Speaker: ${label}, Text: "${text}", Is Final: ${data.is_final}`);

    if (data.is_final) {
      currentUtterance += (currentUtterance ? ' ' : '') + text;
      if (label === 'Interviewer') interviewerContext += (interviewerContext ? ' ' : '') + text;
      if (interviewWindow) interviewWindow.webContents.send('new-transcript', { text, speaker: label, isFinal: true });

      // Only set/restart timer on finals from Interviewer (ignore interims to avoid over-resetting)
      if (label === 'Interviewer') {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(debouncedTrigger, debounceDelay);
        console.log('[Debounce] Timer started/restarted on final transcript');
      }
    } else {
      currentUtterance = text;
      if (interviewWindow) interviewWindow.webContents.send('interim-transcript', { text, speaker: label });
      // No timer reset on interims – let it run
    }
  });

  let lastUtteranceTime = 0;
  dgConnection.on(LiveTranscriptionEvents.UtteranceEnd, () => {
    const now = Date.now();
    if (now - lastUtteranceTime < 400) return;
    lastUtteranceTime = now;

    if (!currentUtterance.trim()) return;

    const label = speakerLabels[lastSpeaker] || 'Unknown';

    console.log(`[UtteranceEnd] Fired! Label: ${label}, Current: "${currentUtterance}"`);

    if (label === 'Interviewer') {
      if (debounceTimer) clearTimeout(debounceTimer);
      debouncedTrigger();  // Immediate on native end
    }

    currentUtterance = '';
    if (interviewWindow) interviewWindow.webContents.send('interim-transcript', { text: '', speaker: null });
  });

  function debouncedTrigger() {
    const now = Date.now();
    if (now - lastActivityTime < debounceDelay) {
      console.log('[Debounce] Recent activity detected, skipping trigger');
      return;
    }

    const full = (interviewerContext + ' ' + currentUtterance).trim();
    const isQuestion = full.endsWith('?') ||
      /(what|how|why|where|when|who|which|can|could|would|should|tell|explain|describe|is|do|does)/i.test(full);

    console.log(`[Debounce] Checking trigger: Full: "${full}", IsQuestion: ${isQuestion}`);

    if (isQuestion) {
      chatHistory.push({ role: 'user', content: full });
      if (interviewWindow) interviewWindow.webContents.send('ai-answer-chunk', '[clear]');
      console.log("trigger groq");
      triggerGroqResponse();
      interviewerContext = '';
      currentUtterance = '';
    }

    debounceTimer = null;
  }

  dgConnection.on(LiveTranscriptionEvents.Error, (err) => {
    console.error('[Deepgram] Error:', err);
  });

  dgConnection.on(LiveTranscriptionEvents.Close, (closeEvent) => {
    console.log(`[Deepgram] Closed (code: ${closeEvent.code}, reason: ${closeEvent.reason || 'unknown'})`);
    if (keepAliveInterval) clearInterval(keepAliveInterval);
    dgConnection = null;

    if (interviewWindow) interviewWindow.webContents.send('connection-status', 'disconnected');

    if (shouldMaintainConnection) {
      console.log('[Deepgram] Reconnecting in 5s...');
      setTimeout(initDeepgramConnection, 5000);
    }
  });
}

async function triggerGroqResponse() {
  if (!interviewWindow) {
    console.log('[Groq] Skipping: No interviewWindow');
    return;
  }
  // if (!groqApiKey) {
  //   console.log('[Groq] Skipping: No groqApiKey set. Please set in settings or .env');
  //   if (interviewWindow) interviewWindow.webContents.send('ai-answer-chunk', '[Error: Groq API key not set]');
  //   return;
  // }

  // console.log('[Groq] Starting request with key: ' + groqApiKey.substring(0, 5) + '...');  // Partial log for debug

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || groqApiKey });

  try {
    const stream = await groq.chat.completions.create({
      messages: chatHistory,
      model: 'llama-3.1-8b-instant',
      stream: true,
      temperature: 0.7
    });

    console.log('[Groq] Stream created:', stream);

    let answer = '';
    let hasChunks = false;
    for await (const chunk of stream) {
      hasChunks = true;
      const delta = chunk.choices[0]?.delta?.content || '';
      console.log('[Groq] Chunk:', delta);
      answer += delta;
      interviewWindow.webContents.send('ai-answer-chunk', delta);
    }

    if (!hasChunks) {
      console.log('[Groq] Stream empty - no chunks received');
      interviewWindow.webContents.send('ai-answer-chunk', '[Warning: Empty response from AI]');
    }

    interviewWindow.webContents.send('ai-answer-complete', true);
    chatHistory.push({ role: 'assistant', content: answer.trim() });
  } catch (err) {
    console.error('[Groq] Error:', err);
    interviewWindow.webContents.send('ai-answer-chunk', '\n[AI Error: ' + err.message + ']');
    interviewWindow.webContents.send('ai-answer-complete', false);
  }
}

function stopSession() {
  shouldMaintainConnection = false;

  if (dgConnection) {
    console.log('[Session] Closing Deepgram...');
    dgConnection.finish();
    dgConnection = null;
  }

  if (keepAliveInterval) clearInterval(keepAliveInterval);

  chatHistory = [chatHistory[0]];
  currentUtterance = '';
  interviewerContext = '';
  lastSpeaker = null;
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.yourname.meeting-overlay');

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  ipcMain.on('open-settings', createSettingsWindow);

  ipcMain.on('close-settings-window', () => {
    if (settingsWindow && !settingsWindow.isDestroyed()) settingsWindow.close();
  });

  ipcMain.on('open-interview', () => {
    shouldMaintainConnection = true;
    createInterviewWindow();
    initDeepgramConnection();
  });

  ipcMain.on('close-interview', () => {
    if (interviewWindow && !interviewWindow.isDestroyed()) interviewWindow.close();
    stopSession();
  });

  ipcMain.on('set-theme', (_, theme) => {
    currentTheme = theme;
    store.set('theme', theme);
    BrowserWindow.getAllWindows().forEach((win) => win.webContents.send('theme-updated', theme));
  });

  ipcMain.handle('get-theme', () => currentTheme);

  ipcMain.handle('get-deepgram-api-key', () => deepgramApiKey);

  ipcMain.on('set-deepgram-api-key', (_, key) => {
    deepgramApiKey = key;
    store.set('deepgramApiKey', key);
  });

  ipcMain.on('set-groq-api-key', (_, key) => {
    groqApiKey = key;
    store.set('groqApiKey', key);
  });

  ipcMain.handle('get-groq-api-key', () => groqApiKey);

  ipcMain.on('audio-data', (_, buffer) => {
    if (dgConnection && dgConnection.getReadyState() === 1) {
      dgConnection.send(Buffer.from(buffer));
    }
  });

  if (process.platform === 'darwin') {
    app.commandLine.appendSwitch('enable-features', 'MacLoopbackAudioForScreenShare,MacCaptureSystemAudioLoopbackCapture');
  }

  session.defaultSession.setDisplayMediaRequestHandler((request, callback) => {
    desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: 1, height: 1 } }).then((sources) => {
      callback({
        video: sources[0],
        audio: 'loopback',
        enableLocalEcho: false
      });
    });
  });

  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('window-all-closed', () => {
  stopSession();
  if (process.platform !== 'darwin') app.quit();
});