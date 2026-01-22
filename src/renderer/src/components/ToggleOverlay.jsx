// src/components/ToggleOverlay.jsx
export default function ToggleOverlay({ onToggle }) {
  return (
    <button
      onClick={onToggle}
      className={`
        pointer-events-auto fixed bottom-6 right-6
        bg-black/60 backdrop-blur-xl border border-white/10
        text-white px-5 py-3 rounded-full shadow-xl
        hover:bg-black/80 transition-colors text-sm font-medium
        flex items-center gap-2
      `}
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 15l-6-6-6 6" />
      </svg>
      Show Overlay
    </button>
  );
}