import { useState } from "react";
import { useArena } from "../../hooks/useCameraControls";
import type { Page } from "../../data/types";

const mono = "'IBM Plex Mono', monospace";
const heading = "'Space Grotesk', sans-serif";
const body = "'Inter', sans-serif";

const navItems: { id: Page; label: string }[] = [
  { id: "map", label: "Map" },
  { id: "leaderboard", label: "Leaderboard" },
  { id: "tasks", label: "Tasks" },
  { id: "swarm", label: "My Swarm" },
];

function WalletDropdown() {
  return (
    <div style={{
      position: "absolute", top: "100%", right: 0, marginTop: 8, width: 240, padding: 20,
      borderRadius: 12, background: "rgba(8,10,18,0.98)", border: "1px solid rgba(255,255,255,0.06)",
      backdropFilter: "blur(20px)", zIndex: 60,
    }}>
      <div style={{ fontFamily: mono, fontSize: 8, letterSpacing: "0.15em", color: "rgba(255,255,255,0.15)", marginBottom: 16, textTransform: "uppercase" }}>Wallet</div>
      {[
        { label: "Balance", value: "47,250 AET", color: "#FFB800" },
        { label: "Staked", value: "25,000 AET", color: "#E8EDF2" },
        { label: "Available", value: "22,250 AET", color: "#4DFFB8" },
        { label: "Trust Limit", value: "50,000 AET", color: "#00D4FF" },
        { label: "Multiplier", value: "2x (Level 2)", color: "rgba(255,255,255,0.5)" },
      ].map((item) => (
        <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0" }}>
          <span style={{ fontFamily: body, fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{item.label}</span>
          <span style={{ fontFamily: mono, fontSize: 11, color: item.color }}>{item.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function TopBar() {
  const { activePage, setActivePage } = useArena();
  const [showWallet, setShowWallet] = useState(false);

  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 50, width: "100%",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
      backgroundColor: "rgba(10,14,26,0.95)",
      backdropFilter: "blur(12px)",
    }}>
      <div style={{
        maxWidth: 1400, marginLeft: "auto", marginRight: "auto",
        paddingLeft: 32, paddingRight: 32,
        height: 56, display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        {/* Logo */}
        <div onClick={() => setActivePage("landing")} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
          <svg width="18" height="18" viewBox="0 0 28 28" fill="none">
            <defs><linearGradient id="lg2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#00D4FF" /><stop offset="100%" stopColor="#7B61FF" /></linearGradient></defs>
            <polygon points="14,2 26,24 2,24" fill="none" stroke="url(#lg2)" strokeWidth="1.5" />
          </svg>
          <span style={{ fontFamily: heading, fontSize: 13, fontWeight: 600, color: "#fff", letterSpacing: "0.05em" }}>AetherNet</span>
        </div>

        {/* Nav */}
        <nav style={{ display: "flex", gap: 4 }}>
          {navItems.map((tab) => {
            const isActive = activePage === tab.id;
            return (
              <button key={tab.id} onClick={() => setActivePage(tab.id)} style={{
                fontFamily: mono, fontSize: 12, fontWeight: isActive ? 600 : 400,
                letterSpacing: "0.05em", color: isActive ? "#00D4FF" : "#6B7A8D",
                backgroundColor: isActive ? "rgba(0,212,255,0.08)" : "transparent",
                border: `1px solid ${isActive ? "rgba(0,212,255,0.2)" : "transparent"}`,
                padding: "6px 16px", borderRadius: 6, cursor: "pointer", transition: "all 0.15s ease",
              }}>{tab.label}</button>
            );
          })}
        </nav>

        {/* Right */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ position: "relative" }}>
            <button onClick={() => setShowWallet(!showWallet)}
              onBlur={() => setTimeout(() => setShowWallet(false), 200)}
              style={{
                display: "flex", alignItems: "center", gap: 6, padding: "5px 12px",
                borderRadius: 6, border: "1px solid rgba(255,184,0,0.12)", cursor: "pointer",
                background: "transparent", transition: "all 0.15s",
              }}
            >
              <span style={{ fontFamily: mono, fontSize: 13, fontWeight: 600, color: "#FFB800" }}>△ 47,250</span>
              <span style={{ fontFamily: mono, fontSize: 11, color: "#6B7A8D", fontWeight: 400 }}>AET</span>
            </button>
            {showWallet && <WalletDropdown />}
          </div>
          <span style={{ fontFamily: mono, fontSize: 10, color: "#6B7A8D", letterSpacing: "0.08em" }}>S1·W4</span>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: "#4DFFB8", boxShadow: "0 0 8px rgba(77,255,184,0.5)" }} />
            <span style={{ fontFamily: mono, fontSize: 10, fontWeight: 600, color: "#4DFFB8" }}>LIVE</span>
          </div>
        </div>
      </div>
    </header>
  );
}
