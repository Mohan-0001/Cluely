// src/renderer/src/components/InterviewPage.jsx
import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../context/theme';

export default function InterviewPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [interviewerText, setInterviewerText] = useState(''); // Single accumulating paragraph for interviewer
  const [interimText, setInterimText] = useState('');
  const [messages, setMessages] = useState([]); // Only AI responses + any breaks if needed
  const [aiText, setAiText] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);

  const audioContext = useRef(null);
  const processor = useRef(null);
  const stream = useRef(null);
  const scroll = useRef(null);

  useEffect(() => {
    window.electronAPI.onConnectionStatus(setConnectionStatus);

    window.electronAPI.onNewTranscript((data) => {
      if (data.speaker !== 'Interviewer') return;

      // Append to the single interviewer paragraph
      setInterviewerText((prev) => {
        const newText = prev ? prev + (prev.endsWith(' ') || prev.endsWith('.') ? ' ' : ' ') + data.text : data.text;
        return newText;
      });

      setInterimText('');
    });

    window.electronAPI.onInterimTranscript((data) => {
      if (data.speaker === 'Interviewer') {
        setInterimText(data.text);
      }
    });

    window.electronAPI.onAiAnswerChunk((chunk) => {
      if (chunk === '[clear]') {
        setAiText('');
        setIsAiTyping(true);
      } else {
        setAiText((prev) => prev + chunk);
      }
    });

    window.electronAPI.onAiAnswerComplete(() => {
      if (aiText.trim()) {
        setMessages((prev) => [...prev, { type: 'ai', text: aiText.trim() }]);
        // Optional: After AI answers, start a new interviewer paragraph for next question
        setInterviewerText('');
      }
      setAiText('');
      setIsAiTyping(false);
    });

    startCapture();

    return () => stopCapture();
  }, [aiText]);

  useEffect(() => {
    if (scroll.current) scroll.current.scrollTop = scroll.current.scrollHeight;
  }, [interviewerText, interimText, messages, aiText]);

  const startCapture = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: { width: 1, height: 1 },
        audio: true
      });

      mediaStream.getVideoTracks().forEach(t => t.stop());

      stream.current = mediaStream;

      audioContext.current = new AudioContext({ sampleRate: 16000 });
      const source = audioContext.current.createMediaStreamSource(mediaStream);
      processor.current = audioContext.current.createScriptProcessor(4096, 1, 1);

      processor.current.onaudioprocess = (e) => {
        const data = e.inputBuffer.getChannelData(0);
        const buffer = new Int16Array(data.length);
        for (let i = 0; i < data.length; i++) {
          let s = data[i];
          s = Math.max(-1, Math.min(1, s));
          buffer[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        window.electronAPI.sendAudioData(buffer.buffer);
      };

      source.connect(processor.current);
      processor.current.connect(audioContext.current.destination);

      if (audioContext.current.state === 'suspended') await audioContext.current.resume();
    } catch (e) {
      console.error('[Audio] Capture failed:', e);
    }
  };

  const stopCapture = () => {
    if (processor.current) processor.current.disconnect();
    if (audioContext.current) audioContext.current.close();
    if (stream.current) stream.current.getTracks().forEach(t => t.stop());
  };

  return (
    <div className={`h-full flex flex-col p-6 ${isDark ? 'bg-gray-950 text-white' : 'bg-white text-gray-900'}`}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Interview Copilot</h1>
        <div className="flex items-center gap-4">
          <div className={`w-3 h-3 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <button 
            onClick={() => window.electronAPI.closeInterview()} 
            className="px-5 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm font-medium"
          >
            End Session
          </button>
        </div>
      </div>

      <div ref={scroll} className="flex-1 overflow-y-auto space-y-6 pr-2">
        {interviewerText || interimText || messages.length > 0 || isAiTyping ? null : (
          <div className="h-full flex flex-col items-center justify-center opacity-60 text-center">
            <p className="text-xl">Waiting for interviewer to speak...</p>
            <p className="mt-2 text-sm">Status: {connectionStatus}</p>
          </div>
        )}

        {/* Single continuous interviewer paragraph */}
        {(interviewerText || interimText) && (
          <div className={`p-5 rounded-2xl ${isDark ? 'bg-blue-950/40 border border-blue-800/30' : 'bg-blue-50 border border-blue-200'}`}>
            <strong className="text-blue-400">Interviewer:</strong>{' '}
            {interviewerText}
            {interimText && (
              <span className="italic opacity-70"> {interimText}</span>
            )}
          </div>
        )}

        {/* AI responses as separate bubbles */}
        {messages.map((m, i) => (
          <div key={i} className={`p-5 rounded-2xl ${isDark ? 'bg-purple-950/40 border border-purple-800/30' : 'bg-purple-50 border border-purple-200'}`}>
            <p className="whitespace-pre-wrap">{m.text}</p>
          </div>
        ))}

        {isAiTyping && (
          <div className={`p-5 rounded-2xl ${isDark ? 'bg-purple-950/40 border border-purple-800/30' : 'bg-purple-50 border border-purple-200'}`}>
            {aiText || <span className="opacity-60">Generating answer...</span>}
          </div>
        )}
      </div>
    </div>
  );
}