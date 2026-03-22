const mono = "'IBM Plex Mono', monospace";

type Dir = "up" | "down" | "left" | "right";

const arrows: { dir: Dir; label: string; pos: React.CSSProperties }[] = [
  { dir: "up", label: "▲", pos: { top: 96, left: "50%", transform: "translateX(-50%)" } },
  { dir: "down", label: "▼", pos: { bottom: 60, left: "50%", transform: "translateX(-50%)" } },
  { dir: "left", label: "◄", pos: { left: 256, top: "50%", transform: "translateY(-50%)" } },
  { dir: "right", label: "►", pos: { right: 16, top: "50%", transform: "translateY(-50%)" } },
];

export default function MapPanControls({ onPan }: { onPan: (dir: Dir) => void }) {
  return (
    <>
      {arrows.map(({ dir, label, pos }) => (
        <button
          key={dir}
          onClick={() => onPan(dir)}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(0,212,255,0.15)";
            e.currentTarget.style.color = "#00D4FF";
            e.currentTarget.style.borderColor = "rgba(0,212,255,0.25)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(10,14,26,0.6)";
            e.currentTarget.style.color = "#6B7A8D";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
          }}
          style={{
            position: "absolute",
            ...pos,
            zIndex: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 40,
            height: 40,
            backgroundColor: "rgba(10,14,26,0.6)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 8,
            color: "#6B7A8D",
            fontSize: 16,
            fontFamily: mono,
            cursor: "pointer",
            backdropFilter: "blur(4px)",
            userSelect: "none",
            transition: "all 0.15s ease",
          }}
        >
          {label}
        </button>
      ))}
    </>
  );
}
