import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { useArena } from "../../hooks/useCameraControls";
import { api, isMock, initApi, getStoredAgentId, getActiveAgentId } from "../../services/api";
import { useWallet } from "../../wallet/context";
import WalletPanel from "./WalletPanel";
import ConnectWallet from "./ConnectWallet";
import type { Page } from "../../data/types";

const mono = "'IBM Plex Mono', monospace";
const heading = "'Space Grotesk', sans-serif";

interface NavItem { id: Page | "docs"; label: string; external?: string }
const navItems: NavItem[] = [
  { id: "map", label: "Map" },
  { id: "tasks", label: "Tasks" },
  { id: "post-task", label: "Post Task" },
  { id: "leaderboard", label: "Leaderboard" },
  { id: "swarm", label: "My Swarm" },
  { id: "docs", label: "Docs", external: "https://github.com/Aethernet-network/aethernet/blob/main/docs/quickstart.md" },
];

function fmt(uaet: number): string {
  return Math.round(uaet / 1_000_000).toLocaleString();
}

export default function TopBar() {
  const { activePage, setActivePage } = useArena();
  const { keypair, isLocked } = useWallet();
  const [showWallet, setShowWallet] = useState(false);
  const [showConnect, setShowConnect] = useState(false);

  const [agentId, setAgentId] = useState("");
  const [balance, setBalance] = useState(47250000000);
  const [staked, setStaked] = useState(25000000000);
  const [refreshing, setRefreshing] = useState(false);
  const [trustLimit, setTrustLimit] = useState(50000000000);
  const [multiplier, setMultiplier] = useState(2);

  const isConnected = !!keypair && !isLocked;
  const [networkPeers, setNetworkPeers] = useState(0);
  const [networkAgents, setNetworkAgents] = useState(0);

  function loadWalletData(id: string) {
    api.getAgentBalance(id).then((b: any) => {
      const val = b?.balance ?? b?.amount;
      if (val != null) setBalance(val);
    }).catch(() => {});
    api.getAgentStake(id).then((s: any) => {
      const st = s?.staked_amount ?? s?.staked ?? s?.amount;
      if (st != null) setStaked(st);
      if (s?.trust_limit != null) setTrustLimit(s.trust_limit);
      if (s?.trust_multiplier != null) setMultiplier(s.trust_multiplier);
    }).catch(() => {});
  }

  async function handleRefresh() {
    if (refreshing || !agentId) return;
    setRefreshing(true);
    loadWalletData(agentId);
    setTimeout(() => setRefreshing(false), 800);
  }

  // Safety net: refresh wallet data when connect modal closes
  useEffect(() => {
    if (!showConnect && agentId) {
      const timer = setTimeout(() => loadWalletData(agentId), 3000);
      return () => clearTimeout(timer);
    }
  }, [showConnect, agentId]);

  // Fetch network status
  useEffect(() => {
    if (isMock) return;
    api.getStatus().then((s: any) => {
      if (s.peers != null) setNetworkPeers(s.peers);
    }).catch(() => {});
    api.getAgents().then((a: any[]) => setNetworkAgents(a.length)).catch(() => {});
  }, []);

  // When wallet connects: use wallet agent ID exclusively
  // When wallet disconnects: clear and fall back to node/stored ID
  useEffect(() => {
    if (isMock) return;

    if (isConnected && keypair) {
      // Wallet connected — use wallet's agent ID, clear old values first
      setAgentId(keypair.agentId);
      setBalance(0);
      setStaked(0);
      setTrustLimit(0);
      setMultiplier(1);
      loadWalletData(keypair.agentId);
      return;
    }

    // Wallet not connected — clear and load node/stored agent
    setBalance(0);
    setStaked(0);
    setTrustLimit(0);
    setMultiplier(1);
    setAgentId("");

    initApi().then(() => {
      const id = getActiveAgentId() || getStoredAgentId() || "";
      if (id) {
        setAgentId(id);
        loadWalletData(id);
      } else {
        api.getStatus().then((s: any) => {
          const nodeId = s.agent_id || "";
          setAgentId(nodeId);
          if (nodeId) loadWalletData(nodeId);
        }).catch(() => {});
      }
    });
  }, [isConnected, keypair?.agentId]);

  return (
    <>
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
                <button key={tab.id} onClick={() => {
                  if (tab.external) { window.open(tab.external, "_blank"); return; }
                  setActivePage(tab.id as Page);
                }} style={{
                  fontFamily: mono, fontSize: 12, fontWeight: isActive ? 600 : 400,
                  letterSpacing: "0.05em", color: isActive ? "#00D4FF" : "#6B7A8D",
                  backgroundColor: isActive ? "rgba(0,212,255,0.08)" : "transparent",
                  border: `1px solid ${isActive ? "rgba(0,212,255,0.2)" : "transparent"}`,
                  padding: "6px 16px", borderRadius: 6, cursor: "pointer", transition: "all 0.15s ease",
                }}>{tab.label}{tab.external ? " ↗" : ""}</button>
              );
            })}
          </nav>

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* Wallet button or Connect button */}
            {isConnected ? (
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <button onClick={() => setShowWallet(!showWallet)} style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "5px 12px",
                  borderRadius: 6, border: "1px solid rgba(255,184,0,0.12)", cursor: "pointer",
                  background: showWallet ? "rgba(255,184,0,0.06)" : "transparent", transition: "all 0.15s",
                }}>
                  <span style={{ fontFamily: mono, fontSize: 13, fontWeight: 600, color: "#FFB800" }}>△ {fmt(balance + staked)}</span>
                  <span style={{ fontFamily: mono, fontSize: 11, color: "#6B7A8D", fontWeight: 400 }}>AET</span>
                </button>
                <button onClick={handleRefresh} disabled={refreshing} title="Refresh balance" style={{
                  width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center",
                  background: "none", border: "none", cursor: refreshing ? "default" : "pointer", padding: 0,
                }}>
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ animation: refreshing ? "walletSpin 0.8s linear infinite" : "none" }}>
                    <path d="M13.5 8a5.5 5.5 0 1 1-1.3-3.5M13.5 2v2.5H11" stroke={refreshing ? "#00D4FF" : "#4A5568"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            ) : (
              <button onClick={() => setShowConnect(true)} style={{
                display: "flex", alignItems: "center", gap: 6, padding: "6px 16px",
                borderRadius: 6, border: "1px solid rgba(0,212,255,0.2)", cursor: "pointer",
                background: "rgba(0,212,255,0.06)", transition: "all 0.15s",
              }}>
                <span style={{ fontFamily: mono, fontSize: 12, fontWeight: 600, color: "#00D4FF" }}>Connect Wallet</span>
              </button>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#4DFFB8", boxShadow: "0 0 6px rgba(77,255,184,0.4)" }} />
              <span style={{ fontFamily: mono, fontSize: 9, fontWeight: 600, color: "#4DFFB8" }}>TESTNET</span>
              {networkPeers > 0 && <span style={{ fontFamily: mono, fontSize: 9, color: "#4A5568" }}>{networkPeers}p · {networkAgents}a</span>}
            </div>
          </div>
        </div>
      </header>

      {showWallet && isConnected && (
        <WalletPanel
          agentId={agentId} balance={balance} staked={staked} trustLimit={trustLimit} multiplier={multiplier}
          onClose={() => setShowWallet(false)} onBalanceChange={setBalance} onStakeChange={setStaked}
        />
      )}

      <AnimatePresence>
        {showConnect && <ConnectWallet onClose={() => setShowConnect(false)} onFunded={(id) => loadWalletData(id)} />}
      </AnimatePresence>
    </>
  );
}
