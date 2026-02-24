// src/renderer/src/components/InterviewPage.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from '../context/theme';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function InterviewPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const codeStyle = isDark ? oneDark : oneLight;

  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [interviewerText, setInterviewerText] = useState('');
  const [interimText, setInterimText] = useState('');
  // Completed AI messages shown as bubbles
  const [messages, setMessages] = useState([]);
  // Live streaming text shown in the typing bubble
  const [aiText, setAiText] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);

  // Ref to always hold the latest aiText without stale closure issues
  const aiTextRef = useRef('');

  const audioContext = useRef(null);
  const processor = useRef(null);
  const stream = useRef(null);
  const scroll = useRef(null);

  // ── IPC listeners ──────────────────────────────────────────────────────────
  useEffect(() => {
    // Each onXxx returns a cleanup/remove function from the preload
    const removeConnectionStatus = window.electronAPI.onConnectionStatus(
      (status) => setConnectionStatus(status)
    );

    const removeNewTranscript = window.electronAPI.onNewTranscript((data) => {
      if (data.speaker !== 'Interviewer') return;
      setInterviewerText((prev) => (prev ? prev + ' ' + data.text : data.text));
      setInterimText('');
    });

    const removeInterimTranscript = window.electronAPI.onInterimTranscript((data) => {
      if (data.speaker === 'Interviewer') setInterimText(data.text || '');
    });

    const removeAiChunk = window.electronAPI.onAiAnswerChunk((chunk) => {
      if (chunk === '[clear]') {
        aiTextRef.current = '';
        setAiText('');
        setIsAiTyping(true);
      } else {
        aiTextRef.current += chunk;
        setAiText(aiTextRef.current);
      }
    });

    const removeAiComplete = window.electronAPI.onAiAnswerComplete(() => {
      const finalText = aiTextRef.current.trim();
      if (finalText) {
        setMessages((prev) => [...prev, { type: 'ai', text: finalText }]);
        setInterviewerText('');
      }
      aiTextRef.current = '';
      setAiText('');
      setIsAiTyping(false);
    });

    startCapture();

    // Cleanup: remove every IPC listener and stop audio
    return () => {
      removeConnectionStatus?.();
      removeNewTranscript?.();
      removeInterimTranscript?.();
      removeAiChunk?.();
      removeAiComplete?.();
      stopCapture();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run ONCE — handlers use refs/functional setters, no stale closures

  // Auto-scroll to bottom whenever content changes
  useEffect(() => {
    if (scroll.current) scroll.current.scrollTop = scroll.current.scrollHeight;
  }, [interviewerText, interimText, messages, aiText]);

  // ── Audio capture ──────────────────────────────────────────────────────────
  const startCapture = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: { width: 1, height: 1 },
        audio: true
      });

      mediaStream.getVideoTracks().forEach((t) => t.stop());
      stream.current = mediaStream;

      audioContext.current = new AudioContext({ sampleRate: 16000 });
      const source = audioContext.current.createMediaStreamSource(mediaStream);
      processor.current = audioContext.current.createScriptProcessor(4096, 1, 1);

      processor.current.onaudioprocess = (e) => {
        const data = e.inputBuffer.getChannelData(0);
        const buffer = new Int16Array(data.length);
        for (let i = 0; i < data.length; i++) {
          let s = Math.max(-1, Math.min(1, data[i]));
          buffer[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }
        window.electronAPI.sendAudioData(buffer.buffer);
      };

      source.connect(processor.current);
      processor.current.connect(audioContext.current.destination);

      if (audioContext.current.state === 'suspended') {
        await audioContext.current.resume();
      }
    } catch (e) {
      console.error('[Audio] Capture failed:', e);
    }
  };

  const stopCapture = () => {
    if (processor.current) processor.current.disconnect();
    if (audioContext.current) audioContext.current.close();
    if (stream.current) stream.current.getTracks().forEach((t) => t.stop());
  };

  // ── Markdown code-block renderer ───────────────────────────────────────────
  const markdownComponents = {
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <SyntaxHighlighter
          {...props}
          style={codeStyle}
          language={match[1]}
          PreTag="div"
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code className={className} {...props}>
          {children}
        </code>
      );
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      className={`h-full flex flex-col p-6 ${isDark ? 'bg-gray-950 text-white' : 'bg-white text-gray-900'}`}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Interview Copilot</h1>
        <div className="flex items-center gap-4">
          <div
            className={`w-3 h-3 rounded-full ${connectionStatus === 'connected'
              ? 'bg-green-500 animate-pulse'
              : 'bg-red-500'
              }`}
          />
          <span className="text-xs opacity-60">{connectionStatus}</span>
          <button
            onClick={() => window.electronAPI.closeInterview()}
            className="px-5 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm font-medium"
          >
            End Session
          </button>
        </div>
      </div>

      {/* Scrollable content area */}
      <div ref={scroll} className="flex-1 overflow-y-auto space-y-6 pr-2">
        {/* Empty state */}
        {!interviewerText && !interimText && messages.length === 0 && !isAiTyping && (
          <div className="h-full flex flex-col items-center justify-center opacity-60 text-center">
            <p className="text-xl">Waiting for interviewer to speak…</p>
            <p className="mt-2 text-sm">Status: {connectionStatus}</p>
          </div>
        )}

        {/* Interviewer speech block */}
        {(interviewerText || interimText) && (
          <div
            className={`p-5 rounded-2xl ${isDark
              ? 'bg-blue-950/40 border border-blue-800/30'
              : 'bg-blue-50 border border-blue-200'
              }`}
          >
            <strong className="text-blue-400 block mb-1">Interviewer</strong>
            <p>
              {interviewerText}
              {interimText && (
                <span className="italic opacity-60"> {interimText}</span>
              )}
            </p>
          </div>
        )}

        {/* Completed AI answer bubbles */}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`p-5 rounded-2xl ${isDark
              ? 'bg-purple-950/40 border border-purple-800/30'
              : 'bg-purple-50 border border-purple-200'
              }`}
          >
            <strong
              className={`block mb-2 text-sm font-semibold ${isDark ? 'text-purple-300' : 'text-purple-700'}`}
            >
              AI Answer
            </strong>
            <ReactMarkdown components={markdownComponents}>{m.text}</ReactMarkdown>
          </div>
        ))}

        {/* Live streaming bubble */}
        {isAiTyping && (
          <div
            className={`p-5 rounded-2xl ${isDark
              ? 'bg-purple-950/40 border border-purple-800/30'
              : 'bg-purple-50 border border-purple-200'
              }`}
          >
            <strong
              className={`block mb-2 text-sm font-semibold ${isDark ? 'text-purple-300' : 'text-purple-700'}`}
            >
              AI Answer
              <span className="ml-2 inline-block w-2 h-4 bg-purple-400 animate-pulse rounded-sm align-middle" />
            </strong>
            {aiText ? (
              <ReactMarkdown components={markdownComponents}>{aiText}</ReactMarkdown>
            ) : (
              <span className="opacity-50 text-sm">Generating answer…</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}