import { useState } from "react";

const mono = "'IBM Plex Mono', monospace";

export default function MapLegend() {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: "absolute", bottom: 16, right: 16, zIndex: 20 }}>
      <button onClick={() => setOpen(!open)} style={{
        display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
        backgroundColor: "rgba(10,14,26,0.9)", border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 6, fontFamily: mono, fontSize: 10, letterSpacing: "0.08em",
        color: "#6B7A8D", cursor: "pointer",
      }}>
        <span style={{ fontSize: 14 }}>◈</span>
        {open ? "HIDE LEGEND" : "LEGEND"}
      </button>

      {open && (
        <div style={{
          position: "absolute", bottom: 40, right: 0, padding: "16px 20px",
          backgroundColor: "rgba(10,14,26,0.95)", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 8, backdropFilter: "blur(8px)", minWidth: 230,
        }}>
          <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: "0.12em", color: "#4A5568", marginBottom: 14 }}>MAP LEGEND</div>

          {/* Node sizes */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontFamily: mono, fontSize: 10, color: "#6B7A8D", marginBottom: 8 }}>NODE SIZE = REPUTATION</div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 14 }}>
              {[
                { size: 6, label: "Bronze" },
                { size: 9, label: "Silver" },
                { size: 12, label: "Gold" },
                { size: 16, label: "Diamond" },
              ].map((item) => (
                <div key={item.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{ width: item.size, height: item.size, borderRadius: 2, backgroundColor: "#00D4FF", opacity: 0.5 + (item.size / 20) * 0.5 }} />
                  <span style={{ fontFamily: mono, fontSize: 8, color: "#4A5568" }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Status */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontFamily: mono, fontSize: 10, color: "#6B7A8D", marginBottom: 8 }}>STATUS</div>
            {[
              { color: "#4DFFB8", label: "Active — processing tasks" },
              { color: "#FFB800", label: "Settling — awaiting verification" },
              { color: "#4A5568", label: "Idle — no current tasks" },
              { color: "#FF4D6A", label: "Disputed / Slashed" },
            ].map((item) => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: item.color, flexShrink: 0, boxShadow: `0 0 6px ${item.color}44` }} />
                <span style={{ fontFamily: mono, fontSize: 10, color: "#A0AEC0" }}>{item.label}</span>
              </div>
            ))}
          </div>

          {/* Connections */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontFamily: mono, fontSize: 10, color: "#6B7A8D", marginBottom: 8 }}>CONNECTIONS</div>
            {[
              { dash: true, label: "Alliance cooperation link" },
              { dash: false, label: "Active task flow" },
            ].map((item) => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                <div style={{ width: 24, height: 0, borderTop: item.dash ? "2px dashed rgba(0,212,255,0.4)" : "2px solid rgba(77,255,184,0.5)", flexShrink: 0 }} />
                <span style={{ fontFamily: mono, fontSize: 10, color: "#A0AEC0" }}>{item.label}</span>
              </div>
            ))}
          </div>

          {/* Zones */}
          <div>
            <div style={{ fontFamily: mono, fontSize: 10, color: "#6B7A8D", marginBottom: 8 }}>ZONES</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 12, height: 12, borderRadius: "50%", border: "2px solid #7B61FF", opacity: 0.6, flexShrink: 0 }} />
              <span style={{ fontFamily: mono, fontSize: 10, color: "#A0AEC0" }}>The Lobby — recruitment zone</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
