import { motion, AnimatePresence } from "framer-motion";
import { useArena } from "../../hooks/useCameraControls";
import type { Swarm } from "../../data/types";

const mono = "'IBM Plex Mono', monospace";
const body = "'Inter', sans-serif";
const heading = "'Space Grotesk', sans-serif";

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const w = 280, h = 32;
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 4) - 2}`).join(" ");
  const fill = `0,${h} ${pts} ${w},${h}`;
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <defs><linearGradient id="spf" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.15" /><stop offset="100%" stopColor={color} stopOpacity="0" /></linearGradient></defs>
      <polygon points={fill} fill="url(#spf)" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function AgentPanel({ swarms }: { swarms: Swarm[] }) {
  const { zoomLevel, selectedSwarm, selectedAgent, selectAgent } = useArena();
  const swarm = swarms.find((s) => s.id === selectedSwarm);
  const agent = swarm?.agents.find((a) => a.agent_id === selectedAgent);
  const show = zoomLevel === 3 && agent != null;
  const successRate = agent ? (agent.tasks_completed > 0 ? Math.round((agent.tasks_completed / (agent.tasks_completed + agent.tasks_failed)) * 100) : 0) : 0;

  return (
    <AnimatePresence>
      {show && agent && swarm && (
        <motion.div key="agent-panel" initial={{ x: 400, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 400, opacity: 0 }}
          transition={{ type: "spring", damping: 30, stiffness: 200 }}
          style={{
            position: "absolute", top: 88, right: 0, bottom: 0, width: 400, zIndex: 50,
            overflowY: "auto", overflowX: "hidden",
            background: "rgba(8,10,18,0.95)", borderLeft: "1px solid rgba(255,255,255,0.06)",
            backdropFilter: "blur(20px)",
          }}
        >
          <div style={{ padding: "24px 28px" }}>
            {/* Close */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <button onClick={() => selectAgent(null)} style={{
                display: "flex", alignItems: "center", gap: 4, fontFamily: mono, fontSize: 10,
                color: "rgba(255,255,255,0.2)", cursor: "pointer", background: "none", border: "none",
              }}>
                <svg width="10" height="10" viewBox="0 0 14 14" fill="none"><path d="M9 3L5 7l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                {swarm.name}
              </button>
              <button onClick={() => selectAgent(null)} style={{
                width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 6, color: "#6B7A8D", cursor: "pointer", fontSize: 16, fontFamily: mono,
              }}>×</button>
            </div>

            {/* Header */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: agent.currentTask ? "#4DFFB8" : "rgba(255,255,255,0.1)" }} />
                <span style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.08em", color: "rgba(255,255,255,0.2)" }}>
                  AGENT · {agent.currentTask ? "WORKING" : "IDLE"}
                </span>
              </div>
              <h2 style={{ fontFamily: heading, fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 6 }}>{agent.name}</h2>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontFamily: mono, fontSize: 12, padding: "2px 8px", borderRadius: 4, color: "#00D4FF", background: "rgba(0,212,255,0.06)" }}>{agent.model}</span>
                <span style={{ fontFamily: body, fontSize: 12, color: "rgba(255,255,255,0.3)" }}>{swarm.name}</span>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 28 }}>
              {[
                { label: "REPUTATION", value: agent.reputation_score.toLocaleString(), color: "#00D4FF" },
                { label: "TASKS COMPLETED", value: agent.tasks_completed.toString(), color: "#E8EDF2" },
                { label: "TASKS FAILED", value: agent.tasks_failed.toString(), color: agent.tasks_failed > 0 ? "#FF4D6A" : "#E8EDF2" },
                { label: "SUCCESS RATE", value: `${successRate}%`, color: successRate >= 90 ? "#4DFFB8" : "#FFB800" },
                { label: "STAKED", value: `${agent.staked_amount.toLocaleString()} AET`, color: "#E8EDF2" },
                { label: "WEEKLY EARNINGS", value: `${agent.weeklyEarnings} AET`, color: "#FFB800" },
              ].map((s) => (
                <div key={s.label}>
                  <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: "0.1em", color: "#4A5568", marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontFamily: mono, fontSize: 16, fontWeight: 600, color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Sparkline */}
            <div style={{ marginBottom: 28, paddingBottom: 28, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: "0.1em", color: "#4A5568", marginBottom: 12 }}>REPUTATION TREND</div>
              <Sparkline data={agent.reputationHistory} color="#00D4FF" />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                <span style={{ fontFamily: mono, fontSize: 9, color: "rgba(255,255,255,0.1)" }}>20 periods ago</span>
                <span style={{ fontFamily: mono, fontSize: 9, color: "rgba(255,255,255,0.1)" }}>now</span>
              </div>
            </div>

            {/* Trust */}
            <div style={{ marginBottom: 28, paddingBottom: 28, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: "0.1em", color: "#4A5568", marginBottom: 12 }}>TRUST & STAKING</div>
              {[
                { label: "Staked Amount", value: `${agent.staked_amount.toLocaleString()} AET`, color: "#E8EDF2" },
                { label: "Trust Limit", value: `${agent.optimistic_trust_limit.toLocaleString()} AET`, color: "#00D4FF" },
                { label: "Capabilities", value: agent.capabilities.map((c) => c.type).join(", "), color: "rgba(255,255,255,0.5)" },
              ].map((row) => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "6px 0" }}>
                  <span style={{ fontFamily: body, fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{row.label}</span>
                  <span style={{ fontFamily: mono, fontSize: 12, fontWeight: 500, color: row.color, flexShrink: 0, marginLeft: 16 }}>{row.value}</span>
                </div>
              ))}
            </div>

            {/* Current task */}
            {agent.currentTask && (
              <div style={{ marginBottom: 28, paddingBottom: 28, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: "0.1em", color: "#4A5568", marginBottom: 12 }}>CURRENT TASK</div>
                <div style={{ padding: 12, borderRadius: 8, background: "rgba(77,255,184,0.03)", border: "1px solid rgba(77,255,184,0.08)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4DFFB8" }} />
                    <span style={{ fontFamily: mono, fontSize: 12, color: "#E8EDF2" }}>{agent.currentTask}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Identity */}
            <div>
              <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: "0.1em", color: "#4A5568", marginBottom: 8 }}>IDENTITY</div>
              <div style={{ fontFamily: mono, fontSize: 10, color: "rgba(255,255,255,0.2)", wordBreak: "break-all", lineHeight: 1.6, padding: 10, borderRadius: 6, background: "rgba(255,255,255,0.015)" }}>
                {agent.agent_id}
              </div>
              <div style={{ fontFamily: mono, fontSize: 10, color: "rgba(255,255,255,0.12)", wordBreak: "break-all", lineHeight: 1.6, padding: 10, borderRadius: 6, background: "rgba(255,255,255,0.015)", marginTop: 6 }}>
                fingerprint: {agent.fingerprint_hash}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
