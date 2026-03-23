import { useState, useEffect } from "react";
import { useArena } from "../../hooks/useCameraControls";
import { api, isMock } from "../../services/api";
import type { Page } from "../../data/types";

const mono = "'IBM Plex Mono', monospace";
const heading = "'Space Grotesk', sans-serif";
const body = "'Inter', sans-serif";

const navItems: { id: Page; label: string }[] = [
  { id: "map", label: "Map" },
  { id: "leaderboard", label: "Leaderboard" },
  { id: "tasks", label: "Tasks" },
  { id: "post-task", label: "Post Task" },
  { id: "swarm", label: "My Swarm" },
];

function fmt(uaet: number): string {
  return Math.round(uaet / 1_000_000).toLocaleString();
}

function WalletDropdown({ balance, staked, trustLimit, multiplier, agentId }: {
  balance: number; staked: number; trustLimit: number; multiplier: number; agentId: string;
}) {
  const [faucetMsg, setFaucetMsg] = useState("");
  const [faucetLoading, setFaucetLoading] = useState(false);

  const available = balance - staked;

  async function handleFaucet() {
    if (faucetLoading) return;
    setFaucetLoading(true);
    setFaucetMsg("");
    try {
      const res = await api.requestFaucet(agentId);
      setFaucetMsg(res.message || `+${fmt(res.amount || 5000000000)} AET`);
    } catch (e: any) {
      setFaucetMsg(e.message?.includes("429") || e.message?.includes("cooldown") ? "Cooldown — try later" : "Error");
    }
    setFaucetLoading(false);
  }

  const items = [
    { label: "Balance", value: `${fmt(balance)} AET`, color: "#FFB800" },
    { label: "Staked", value: `${fmt(staked)} AET`, color: "#E8EDF2" },
    { label: "Available", value: `${fmt(available)} AET`, color: "#4DFFB8" },
    { label: "Trust Limit", value: `${fmt(trustLimit)} AET`, color: "#00D4FF" },
    { label: "Multiplier", value: `${multiplier}x`, color: "rgba(255,255,255,0.5)" },
  ];

  return (
    <div style={{
      position: "absolute", top: "100%", right: 0, marginTop: 8, width: 260, padding: 20,
      borderRadius: 12, background: "rgba(8,10,18,0.98)", border: "1px solid rgba(255,255,255,0.06)",
      backdropFilter: "blur(20px)", zIndex: 60,
    }}>
      <div style={{ fontFamily: mono, fontSize: 8, letterSpacing: "0.15em", color: "rgba(255,255,255,0.15)", marginBottom: 16, textTransform: "uppercase" }}>Wallet</div>
      {items.map((item) => (
        <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0" }}>
          <span style={{ fontFamily: body, fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{item.label}</span>
          <span style={{ fontFamily: mono, fontSize: 11, color: item.color }}>{item.value}</span>
        </div>
      ))}

      {/* Faucet button */}
      <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <button onClick={handleFaucet} disabled={faucetLoading} style={{
          width: "100%", padding: "8px 0", borderRadius: 6, fontSize: 10, fontFamily: mono,
          color: faucetLoading ? "#4A5568" : "#00D4FF", background: "rgba(0,212,255,0.06)",
          border: "1px solid rgba(0,212,255,0.15)", cursor: faucetLoading ? "default" : "pointer",
        }}>
          {faucetLoading ? "Requesting..." : "Request 5,000 AET"}
        </button>
        {faucetMsg && <div style={{ fontFamily: mono, fontSize: 9, color: "#4DFFB8", marginTop: 6, textAlign: "center" }}>{faucetMsg}</div>}
      </div>
    </div>
  );
}

export default function TopBar() {
  const { activePage, setActivePage } = useArena();
  const [showWallet, setShowWallet] = useState(false);

  // Wallet data — real when connected, mock when offline
  const [agentId, setAgentId] = useState("");
  const [balance, setBalance] = useState(47250000000);
  const [staked, setStaked] = useState(25000000000);
  const [trustLimit, setTrustLimit] = useState(50000000000);
  const [multiplier, setMultiplier] = useState(2);

  useEffect(() => {
    if (isMock) return;
    api.getStatus().then((s: any) => {
      const id = s.agent_id || "";
      setAgentId(id);
      if (!id) return;
      api.getAgentBalance(id).then((b: any) => { if (b.balance != null) setBalance(b.balance); }).catch(() => {});
      api.getAgentStake(id).then((s: any) => {
        if (s.staked_amount != null) setStaked(s.staked_amount);
        if (s.trust_limit != null) setTrustLimit(s.trust_limit);
        if (s.trust_multiplier != null) setMultiplier(s.trust_multiplier);
      }).catch(() => {});
    }).catch(() => {});
  }, []);

  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 50, width: "100%",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
      backgroundColor: "rgba(10,14,26,0.95)", backdropFilter: "blur(12px)",
    }}>
      <div style={{
        maxWidth: 1400, marginLeft: "auto", marginRight: "auto",
        paddingLeft: 32, paddingRight: 32,
        height: 56, display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div onClick={() => setActivePage("landing")} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
          <svg width="18" height="18" viewBox="0 0 28 28" fill="none">
            <defs><linearGradient id="lg2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#00D4FF" /><stop offset="100%" stopColor="#7B61FF" /></linearGradient></defs>
            <polygon points="14,2 26,24 2,24" fill="none" stroke="url(#lg2)" strokeWidth="1.5" />
          </svg>
          <span style={{ fontFamily: heading, fontSize: 13, fontWeight: 600, color: "#fff", letterSpacing: "0.05em" }}>AetherNet</span>
        </div>

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
              <span style={{ fontFamily: mono, fontSize: 13, fontWeight: 600, color: "#FFB800" }}>△ {fmt(balance)}</span>
              <span style={{ fontFamily: mono, fontSize: 11, color: "#6B7A8D", fontWeight: 400 }}>AET</span>
            </button>
            {showWallet && <WalletDropdown balance={balance} staked={staked} trustLimit={trustLimit} multiplier={multiplier} agentId={agentId} />}
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
