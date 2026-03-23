import { useState, useEffect, useCallback } from "react";
import { api } from "../../services/api";

const mono = "'IBM Plex Mono', monospace";
const body = "'Inter', sans-serif";
const heading = "'Space Grotesk', sans-serif";

const MICRO = 1_000_000;
const fmtAET = (micro: number) => (micro / MICRO).toLocaleString(undefined, { maximumFractionDigits: 2 });

type Tab = "overview" | "stake" | "transfer" | "history";

interface Props {
  agentId: string;
  balance: number;
  staked: number;
  trustLimit: number;
  multiplier: number;
  onClose: () => void;
  onBalanceChange: (b: number) => void;
  onStakeChange: (s: number) => void;
}

function TabBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      fontFamily: mono, fontSize: 10, letterSpacing: "0.06em", padding: "8px 14px", cursor: "pointer",
      color: active ? "#00D4FF" : "#6B7A8D", background: "transparent", border: "none",
      borderBottom: active ? "2px solid #00D4FF" : "2px solid transparent", transition: "all 0.15s",
    }}>{label}</button>
  );
}

function ActionInput({ label, placeholder, buttonLabel, onSubmit, max, loading, color = "#00D4FF" }: {
  label: string; placeholder: string; buttonLabel: string; onSubmit: (val: number) => void; max: number; loading: boolean; color?: string;
}) {
  const [val, setVal] = useState("");
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: "0.1em", color: "#4A5568", marginBottom: 6, textTransform: "uppercase" }}>{label}</div>
      <div style={{ display: "flex", gap: 8 }}>
        <input type="number" value={val} onChange={(e) => setVal(e.target.value)} placeholder={placeholder}
          style={{ flex: 1, padding: "10px 14px", borderRadius: 8, fontSize: 13, fontFamily: mono, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "#FFB800", outline: "none" }}
        />
        <button onClick={() => { const n = parseFloat(val); if (n > 0 && n <= max / MICRO) { onSubmit(n); setVal(""); } }} disabled={loading}
          style={{ padding: "10px 18px", borderRadius: 8, fontSize: 11, fontFamily: mono, fontWeight: 600, color: loading ? "#4A5568" : "#000", background: loading ? "rgba(255,255,255,0.03)" : `${color}`, border: "none", cursor: loading ? "default" : "pointer" }}
        >{loading ? "..." : buttonLabel}</button>
      </div>
      <div style={{ fontFamily: mono, fontSize: 9, color: "#4A5568", marginTop: 4 }}>Max: {fmtAET(max)} AET</div>
    </div>
  );
}

export default function WalletPanel({ agentId, balance, staked, trustLimit, multiplier, onClose, onBalanceChange, onStakeChange }: Props) {
  const [tab, setTab] = useState<Tab>("overview");
  const [msg, setMsg] = useState("");
  const [msgColor, setMsgColor] = useState("#4DFFB8");
  const [loading, setLoading] = useState(false);
  const [faucetLoading, setFaucetLoading] = useState(false);

  // Transfer state
  const [recipient, setRecipient] = useState("");
  const [transferAmt, setTransferAmt] = useState("");
  const [memo, setMemo] = useState("");

  // History
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // balance from protocol = spendable (already minus staked)
  const available = balance;
  const totalBalance = balance + staked;

  const showMsg = (text: string, color = "#4DFFB8") => { setMsg(text); setMsgColor(color); setTimeout(() => setMsg(""), 8000); };

  const refreshData = useCallback(async () => {
    if (!agentId) return;
    try {
      const [b, s] = await Promise.all([api.getAgentBalance(agentId), api.getAgentStake(agentId)]);
      if (b.balance != null) onBalanceChange(b.balance);
      if (s.staked_amount != null) onStakeChange(s.staked_amount);
    } catch {}
  }, [agentId, onBalanceChange, onStakeChange]);

  const pollRefresh = useCallback(async () => {
    showMsg("Settling through consensus...");
    for (let i = 0; i < 10; i++) {
      await new Promise((r) => setTimeout(r, 3000));
      await refreshData();
    }
  }, [refreshData]);

  async function handleStake(amtAET: number) {
    setLoading(true);
    try {
      await api.stakeTokens(agentId, Math.round(amtAET * MICRO));
      showMsg(`Staked ${amtAET} AET`);
      pollRefresh();
    } catch (e: any) { showMsg(e.message || "Stake failed", "#FF4D6A"); }
    setLoading(false);
  }

  async function handleUnstake(amtAET: number) {
    setLoading(true);
    try {
      await api.unstakeTokens(agentId, Math.round(amtAET * MICRO));
      showMsg(`Unstaked ${amtAET} AET`);
      pollRefresh();
    } catch (e: any) { showMsg(e.message || "Unstake failed", "#FF4D6A"); }
    setLoading(false);
  }

  async function handleTransfer() {
    const amt = parseFloat(transferAmt);
    if (!recipient.trim() || !amt || amt <= 0) return;
    setLoading(true);
    try {
      const res = await api.transfer(recipient.trim(), Math.round(amt * MICRO), memo.trim());
      showMsg(`Sent ${amt} AET — ${res.event_id?.slice(0, 12)}...`);
      setRecipient(""); setTransferAmt(""); setMemo("");
      pollRefresh();
    } catch (e: any) { showMsg(e.message || "Transfer failed", "#FF4D6A"); }
    setLoading(false);
  }

  async function handleFaucet() {
    setFaucetLoading(true);
    try {
      const res = await api.requestFaucet(agentId);
      showMsg(res.message || `+${fmtAET(res.amount || 5000000000)} AET`);
      pollRefresh();
    } catch (e: any) { showMsg(e.message?.includes("cooldown") ? "Cooldown — try later" : (e.message || "Error"), "#FF4D6A"); }
    setFaucetLoading(false);
  }

  useEffect(() => {
    if (tab === "history" && !historyLoading && history.length === 0) {
      setHistoryLoading(true);
      api.getAgentEvents(30).then((evts) => {
        const filtered = evts.filter((e: any) => e.from === agentId || e.to === agentId || e.agent_id === agentId);
        setHistory(filtered.slice(0, 20));
      }).catch(() => {}).finally(() => setHistoryLoading(false));
    }
  }, [tab, agentId, historyLoading, history.length]);

  const short = (id: string) => id?.length > 16 ? id.slice(0, 8) + "…" + id.slice(-4) : id || "—";

  return (
    <div style={{
      position: "fixed", top: 0, right: 0, bottom: 0, width: 380, zIndex: 60,
      background: "rgba(8,10,18,0.97)", borderLeft: "1px solid rgba(255,255,255,0.06)",
      backdropFilter: "blur(20px)", overflowY: "auto", overflowX: "hidden",
    }}>
      <div style={{ padding: "24px 28px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <span style={{ fontFamily: heading, fontSize: 18, fontWeight: 700, color: "#fff" }}>Wallet</span>
          <button onClick={onClose} style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, color: "#6B7A8D", cursor: "pointer", fontSize: 16, fontFamily: mono }}>×</button>
        </div>

        {/* Balance headline */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: "0.1em", color: "#4A5568", marginBottom: 4, textTransform: "uppercase" }}>Total Balance</div>
          <div style={{ fontFamily: mono, fontSize: 28, fontWeight: 700, color: "#FFB800" }}>{fmtAET(totalBalance)} <span style={{ fontSize: 14, color: "#6B7A8D" }}>AET</span></div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.04)", marginBottom: 24 }}>
          {(["overview", "stake", "transfer", "history"] as Tab[]).map((t) => (
            <TabBtn key={t} label={t.charAt(0).toUpperCase() + t.slice(1)} active={tab === t} onClick={() => setTab(t)} />
          ))}
        </div>

        {/* Status message */}
        {msg && <div style={{ fontFamily: mono, fontSize: 10, color: msgColor, marginBottom: 16, padding: "8px 12px", borderRadius: 6, background: `${msgColor}08`, border: `1px solid ${msgColor}20` }}>{msg}</div>}

        {/* Overview */}
        {tab === "overview" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
              {[
                { label: "STAKED", value: fmtAET(staked), color: "#E8EDF2" },
                { label: "AVAILABLE", value: fmtAET(available), color: "#4DFFB8" },
                { label: "TRUST LIMIT", value: fmtAET(trustLimit), color: "#00D4FF" },
                { label: "MULTIPLIER", value: `${multiplier}x`, color: "rgba(255,255,255,0.5)" },
              ].map((s) => (
                <div key={s.label}>
                  <div style={{ fontFamily: mono, fontSize: 8, letterSpacing: "0.1em", color: "#4A5568", marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontFamily: mono, fontSize: 16, fontWeight: 600, color: s.color }}>{s.value} {s.label !== "MULTIPLIER" ? "AET" : ""}</div>
                </div>
              ))}
            </div>

            {agentId && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: mono, fontSize: 8, letterSpacing: "0.1em", color: "#4A5568", marginBottom: 4 }}>AGENT ID</div>
                <div style={{ fontFamily: mono, fontSize: 10, color: "#6B7A8D", wordBreak: "break-all", padding: 10, borderRadius: 6, background: "rgba(255,255,255,0.015)", cursor: "pointer" }}
                  onClick={() => navigator.clipboard?.writeText(agentId)}
                  title="Click to copy"
                >{agentId}</div>
              </div>
            )}

            <button onClick={handleFaucet} disabled={faucetLoading} style={{
              width: "100%", padding: "12px 0", borderRadius: 8, fontSize: 11, fontFamily: mono,
              color: faucetLoading ? "#4A5568" : "#00D4FF", background: "rgba(0,212,255,0.06)",
              border: "1px solid rgba(0,212,255,0.15)", cursor: faucetLoading ? "default" : "pointer",
            }}>{faucetLoading ? "Requesting..." : "Request 5,000 AET from Faucet"}</button>
          </div>
        )}

        {/* Stake */}
        {tab === "stake" && (
          <div>
            <ActionInput label="Stake AET" placeholder="Amount" buttonLabel="Stake" onSubmit={handleStake} max={available} loading={loading} color="#00D4FF" />
            <ActionInput label="Unstake AET" placeholder="Amount" buttonLabel="Unstake" onSubmit={handleUnstake} max={staked} loading={loading} color="#FF4D6A" />
            <div style={{ padding: 16, borderRadius: 8, background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.04)" }}>
              <div style={{ fontFamily: mono, fontSize: 9, color: "#4A5568", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.1em" }}>Trust Multiplier</div>
              <div style={{ fontFamily: body, fontSize: 12, color: "#6B7A8D", lineHeight: 1.6 }}>
                Stake more and complete more tasks to increase your trust multiplier (1x → 5x). Higher multiplier = higher trust limit per AET staked.
              </div>
            </div>
          </div>
        )}

        {/* Transfer */}
        {tab === "transfer" && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: "0.1em", color: "#4A5568", marginBottom: 6, textTransform: "uppercase" }}>Recipient Agent ID</div>
              <input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="agent-id-hex..."
                style={{ width: "100%", padding: "10px 14px", borderRadius: 8, fontSize: 12, fontFamily: mono, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "#E8EDF2", outline: "none" }}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: "0.1em", color: "#4A5568", marginBottom: 6, textTransform: "uppercase" }}>Amount (AET)</div>
              <input type="number" value={transferAmt} onChange={(e) => setTransferAmt(e.target.value)} placeholder="100"
                style={{ width: "100%", padding: "10px 14px", borderRadius: 8, fontSize: 13, fontFamily: mono, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "#FFB800", outline: "none" }}
              />
              <div style={{ fontFamily: mono, fontSize: 9, color: "#4A5568", marginTop: 4 }}>Available: {fmtAET(available)} AET</div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: "0.1em", color: "#4A5568", marginBottom: 6, textTransform: "uppercase" }}>Memo (optional)</div>
              <input value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="Payment for..."
                style={{ width: "100%", padding: "10px 14px", borderRadius: 8, fontSize: 12, fontFamily: body, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "#E8EDF2", outline: "none" }}
              />
            </div>
            <button onClick={handleTransfer} disabled={loading || !recipient.trim() || !parseFloat(transferAmt)}
              style={{ width: "100%", padding: "12px 0", borderRadius: 8, fontSize: 12, fontWeight: 600, fontFamily: heading, background: loading ? "rgba(255,255,255,0.03)" : "linear-gradient(135deg, #00D4FF, #7B61FF)", color: loading ? "#4A5568" : "#000", border: "none", cursor: loading ? "default" : "pointer" }}
            >{loading ? "Sending..." : "Send AET"}</button>
          </div>
        )}

        {/* History */}
        {tab === "history" && (
          <div>
            {historyLoading && <div style={{ fontFamily: mono, fontSize: 11, color: "#4A5568" }}>Loading...</div>}
            {!historyLoading && history.length === 0 && <div style={{ fontFamily: mono, fontSize: 11, color: "#4A5568" }}>No recent transactions</div>}
            {history.map((evt, i) => {
              const isSent = evt.from === agentId;
              const counterparty = isSent ? evt.to : evt.from;
              const amount = evt.amount || 0;
              return (
                <div key={evt.id || i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                  <div>
                    <div style={{ fontFamily: mono, fontSize: 11, color: isSent ? "#FF4D6A" : "#4DFFB8" }}>{isSent ? "Sent" : "Received"}</div>
                    <div style={{ fontFamily: mono, fontSize: 9, color: "#4A5568" }}>{counterparty ? short(counterparty) : evt.type || "—"}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: mono, fontSize: 12, fontWeight: 600, color: isSent ? "#FF4D6A" : "#4DFFB8" }}>{isSent ? "-" : "+"}{fmtAET(amount)} AET</div>
                    <div style={{ fontFamily: mono, fontSize: 8, color: "#4A5568" }}>{evt.settlement_state || "Settled"}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
