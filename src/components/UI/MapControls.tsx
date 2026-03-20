import { useArena } from "../../hooks/useCameraControls";

export default function MapControls() {
  const { recenter, goBack, zoomLevel, showLobby } = useArena();
  const showBack = zoomLevel > 1 || showLobby;

  return (
    <div className="absolute bottom-20 right-8 z-50 flex flex-col gap-2">
      <button className="w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer transition-all duration-200 hover:bg-white/[0.06]"
        style={{ background: "rgba(10,14,26,0.85)", border: "1px solid rgba(255,255,255,0.06)" }}
        onClick={recenter} title="Recenter"
      >
        <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
          <circle cx="9" cy="9" r="2" stroke="#6B7A8D" strokeWidth="1.5" fill="none" />
          <path d="M9 2v3M9 13v3M2 9h3M13 9h3" stroke="#6B7A8D" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
      {showBack && (
        <button className="w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer transition-all duration-200 hover:bg-white/[0.06]"
          style={{ background: "rgba(10,14,26,0.85)", border: "1px solid rgba(255,255,255,0.06)" }}
          onClick={goBack} title="Back"
        >
          <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
            <path d="M11 4L6 9l5 5" stroke="#6B7A8D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
    </div>
  );
}
