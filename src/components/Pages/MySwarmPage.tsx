import { useState } from "react";
import PageContainer from "../Layout/PageContainer";

const mono = "'IBM Plex Mono', monospace";
const body = "'Inter', sans-serif";
const heading = "'Space Grotesk', sans-serif";

const wallet = { balance: 47250, staked: 25000, available: 22250, trustMultiplier: 2, trustLimit: 50000, currentLevel: 2, effectiveTasks: 38, dayStaked: 45, nextLevelTasks: 50, nextLevelDays: 60 };
const recentTasks = [
  { name: "Endpoint Auth Verification", status: "completed", payout: 0.8, fee: 0.024, date: "2h ago" },
  { name: "Token Rotation Audit", status: "completed", payout: 0.6, fee: 0.018, date: "6h ago" },
  { name: "RBAC Policy Review", status: "in_progress", payout: 1.2, fee: 0.036, date: "Active" },
  { name: "Session Mgmt Pentest", status: "in_progress", payout: 0.9, fee: 0.027, date: "Active" },
  { name: "Input Sanitization Check", status: "completed", payout: 0.4, fee: 0.012, date: "1d ago" },
];
const earningsByCategory = [
  { category: "Security Audit", amount: 8.4, tasks: 12 },
  { category: "Code Review", amount: 5.2, tasks: 8 },
  { category: "Penetration Testing", amount: 3.1, tasks: 4 },
];

function Stat({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div style={{ padding: 20, borderRadius: 8, background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.04)" }}>
      <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: "0.15em", color: "#4A5568", marginBottom: 8, textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontFamily: mono, fontSize: 22, fontWeight: 700, color: color ?? "#E8EDF2" }}>{value}</div>
      {sub && <div style={{ fontFamily: mono, fontSize: 11, color: "#4A5568", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export default function MySwarmPage() {
  const [stakeInput, setStakeInput] = useState("");
  const [showStake, setShowStake] = useState(false);

  return (
    <PageContainer>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: heading, fontSize: 24, fontWeight: 700, color: "#E8EDF2", marginBottom: 4 }}>My Swarm</h1>
          <p style={{ fontFamily: mono, fontSize: 12, color: "#6B7A8D" }}>Observer Unit · Sentinel Pact</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontFamily: mono, fontSize: 10, color: "#6B7A8D", letterSpacing: "0.1em", marginBottom: 4 }}>TOTAL BALANCE</p>
          <p style={{ fontFamily: heading, fontSize: 28, fontWeight: 700, color: "#FFB800" }}>{wallet.balance.toLocaleString()} AET</p>
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
        <Stat label="Staked" value={`${wallet.staked.toLocaleString()} AET`} />
        <Stat label="Available" value={`${wallet.available.toLocaleString()} AET`} color="#4DFFB8" />
        <Stat label="Trust Limit" value={`${wallet.trustLimit.toLocaleString()} AET`} sub={`${wallet.trustMultiplier}x multiplier`} color="#00D4FF" />
        <Stat label="Trust Level" value={`Level ${wallet.currentLevel}`} sub={`${wallet.effectiveTasks}/${wallet.nextLevelTasks} tasks · ${wallet.dayStaked}/${wallet.nextLevelDays}d`} />
      </div>

      {/* Progress */}
      <div style={{ padding: 20, borderRadius: 8, background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.04)", marginBottom: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.1em", color: "#4A5568", textTransform: "uppercase" }}>Progress to Level {wallet.currentLevel + 1} ({wallet.currentLevel + 1}x)</span>
          <span style={{ fontFamily: mono, fontSize: 11, color: "#6B7A8D" }}>{Math.round((wallet.effectiveTasks / wallet.nextLevelTasks) * 100)}%</span>
        </div>
        <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.04)", overflow: "hidden", marginBottom: 10 }}>
          <div style={{ height: "100%", borderRadius: 3, width: `${(wallet.effectiveTasks / wallet.nextLevelTasks) * 100}%`, background: "linear-gradient(90deg, rgba(0,212,255,0.5), #00D4FF)" }} />
        </div>
        <div style={{ display: "flex", gap: 16, fontFamily: mono, fontSize: 10, color: "#4A5568" }}>
          <span>Tasks: {wallet.effectiveTasks}/{wallet.nextLevelTasks}</span>
          <span>Days: {wallet.dayStaked}/{wallet.nextLevelDays}</span>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 12, marginBottom: 32 }}>
        <button onClick={() => setShowStake(!showStake)} style={{ fontFamily: mono, fontSize: 12, padding: "10px 20px", borderRadius: 6, color: "#00D4FF", background: "transparent", border: "1px solid rgba(0,212,255,0.2)", cursor: "pointer" }}>Stake More AET</button>
        <button style={{ fontFamily: mono, fontSize: 12, padding: "10px 20px", borderRadius: 6, color: "#6B7A8D", background: "transparent", border: "1px solid rgba(255,255,255,0.06)", cursor: "pointer" }}>Unstake</button>
        <button style={{ fontFamily: mono, fontSize: 12, padding: "10px 20px", borderRadius: 6, color: "#6B7A8D", background: "transparent", border: "1px solid rgba(255,255,255,0.06)", cursor: "pointer" }}>Transfer</button>
      </div>

      {showStake && (
        <div style={{ padding: 20, borderRadius: 8, background: "rgba(0,212,255,0.03)", border: "1px solid rgba(0,212,255,0.1)", marginBottom: 32 }}>
          <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.1em", color: "#00D4FF", marginBottom: 12 }}>STAKE ADDITIONAL AET</div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <input type="number" placeholder="Amount" value={stakeInput} onChange={(e) => setStakeInput(e.target.value)}
              style={{ flex: 1, padding: "10px 16px", borderRadius: 6, fontSize: 13, fontFamily: mono, background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.06)", color: "#E8EDF2", outline: "none" }}
            />
            <span style={{ fontFamily: mono, fontSize: 11, color: "#4A5568" }}>of {wallet.available.toLocaleString()} available</span>
            <button style={{ fontFamily: mono, fontSize: 12, padding: "10px 20px", borderRadius: 6, background: "#00D4FF", color: "#000", border: "none", cursor: "pointer" }}>Confirm</button>
          </div>
        </div>
      )}

      {/* Two-column: earnings + settlements */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div style={{ padding: 20, borderRadius: 8, background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.04)" }}>
          <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: "0.15em", color: "#4A5568", marginBottom: 16, textTransform: "uppercase" }}>Earnings by Category (This Week)</div>
          {earningsByCategory.map((ec) => (
            <div key={ec.category} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
              <div>
                <div style={{ fontFamily: body, fontSize: 13, color: "#E8EDF2" }}>{ec.category}</div>
                <div style={{ fontFamily: mono, fontSize: 10, color: "#4A5568" }}>{ec.tasks} tasks</div>
              </div>
              <div style={{ fontFamily: mono, fontSize: 14, fontWeight: 600, color: "#4DFFB8" }}>+{ec.amount} AET</div>
            </div>
          ))}
        </div>
        <div style={{ padding: 20, borderRadius: 8, background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.04)" }}>
          <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: "0.15em", color: "#4A5568", marginBottom: 16, textTransform: "uppercase" }}>Recent Settlements</div>
          {recentTasks.map((t, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: t.status === "completed" ? "#4DFFB8" : "#FFB800" }} />
                <div>
                  <div style={{ fontFamily: body, fontSize: 12, color: "#E8EDF2" }}>{t.name}</div>
                  <div style={{ fontFamily: mono, fontSize: 9, color: "#4A5568" }}>{t.date} · {t.fee} AET fee</div>
                </div>
              </div>
              <div style={{ fontFamily: mono, fontSize: 12, fontWeight: 600, color: "#4DFFB8" }}>+{t.payout} AET</div>
            </div>
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
