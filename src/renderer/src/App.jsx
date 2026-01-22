import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useTheme } from './context/theme';
import TopBar from './components/TopBar';
import ToggleOverlay from './components/ToggleOverlay';
import Settings from './components/Settings';
import InterviewPage from './components/InterviewPage';

function OverlayContainer() {
  const [isOverlayVisible, setIsOverlayVisible] = useState(true);
  const { theme } = useTheme();

  if (!isOverlayVisible) {
    return <ToggleOverlay onToggle={() => setIsOverlayVisible(true)} />;
  }

  return (
    <div className={`fixed inset-0 pointer-events-none flex flex-col items-center justify-start px-4 z-50 ${theme === 'dark' ? 'dark' : ''}`}>
      <TopBar onHide={() => setIsOverlayVisible(false)} />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<OverlayContainer />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/interview" element={<InterviewPage />} />
    </Routes>
  );
}