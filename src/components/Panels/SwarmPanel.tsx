import { motion, AnimatePresence } from "framer-motion";
import { useArena } from "../../hooks/useCameraControls";
import type { Swarm, Alliance } from "../../data/types";

const mono = "'IBM Plex Mono', monospace";
const body = "'Inter', sans-serif";
const heading = "'Space Grotesk', sans-serif";

const statusColors: Record<string, string> = { active: "#4DFFB8", settling: "#FFB800", idle: "rgba(255,255,255,0.15)" };

export default function SwarmPanel({ swarms, alliances }: { swarms: Swarm[]; alliances: Alliance[] }) {
  const { zoomLevel, selectedSwarm, selectedAgent, goBack, selectAgent } = useArena();
  const swarm = swarms.find((s) => s.id === selectedSwarm);
  const show = zoomLevel >= 2 && swarm != null && !selectedAgent;
  const memberAlliances = alliances.filter((a) => swarm?.alliances.includes(a.id));

  return (
    <AnimatePresence>
      {show && swarm && (
        <motion.div key="swarm-panel" initial={{ x: 400, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 400, opacity: 0 }}
          transition={{ type: "spring", damping: 30, stiffness: 200 }}
          style={{
            position: "absolute", top: 88, right: 0, bottom: 0, width: 400, zIndex: 50,
            overflowY: "auto", overflowX: "hidden",
            background: "rgba(8,10,18,0.95)", borderLeft: "1px solid rgba(255,255,255,0.06)",
            backdropFilter: "blur(20px)",
          }}
        >
          {/* Inner content with guaranteed padding */}
          <div style={{ padding: "24px 28px" }}>

            {/* Close + status row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: statusColors[swarm.status], flexShrink: 0 }} />
                <span style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.08em", color: "#6B7A8D" }}>{swarm.tier} · {swarm.status.toUpperCase()}</span>
              </div>
              <button onClick={goBack} style={{
                width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 6, color: "#6B7A8D", cursor: "pointer", fontSize: 16, fontFamily: mono,
              }}>×</button>
            </div>

            {/* Name */}
            <h2 style={{ fontFamily: heading, fontSize: 22, fontWeight: 700, color: "#E8EDF2", marginBottom: 4 }}>{swarm.name}</h2>
            <p style={{ fontFamily: mono, fontSize: 12, color: "#6B7A8D", marginBottom: 28 }}>{swarm.specialization} · by {swarm.owner}</p>

            {/* Stats grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 28 }}>
              {[
                { label: "REPUTATION", value: swarm.reputation.toLocaleString() },
                { label: "AGENTS", value: swarm.agents.length.toString() },
                { label: "WEEKLY SETTLEMENTS", value: swarm.weeklySettlements.toString() },
                { label: "FEES EARNED", value: `${swarm.weeklyFees} AET` },
                { label: "SUCCESS RATE", value: `${Math.round(swarm.successRate * 100)}%` },
                { label: "ACTIVE TASKS", value: swarm.activeTasks.length.toString() },
              ].map((s) => (
                <div key={s.label}>
                  <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: "0.1em", color: "#4A5568", marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontFamily: mono, fontSize: 16, fontWeight: 600, color: "#E8EDF2" }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Alliances */}
            {memberAlliances.length > 0 && (
              <div style={{ marginBottom: 28, paddingBottom: 28, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: "0.1em", color: "#4A5568", marginBottom: 12 }}>ALLIANCES</div>
                {memberAlliances.map((a) => (
                  <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                    <span style={{ fontFamily: body, fontSize: 13, color: "#E8EDF2" }}>{a.name}</span>
                    <span style={{ fontFamily: mono, fontSize: 11, color: "#6B7A8D", flexShrink: 0, marginLeft: 12 }}>{a.swarmIds.length} members</span>
                  </div>
                ))}
              </div>
            )}

            {/* Agents */}
            <div>
              <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: "0.1em", color: "#4A5568", marginBottom: 12 }}>
                AGENTS · {swarm.agents.length}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {swarm.agents.map((agent) => (
                  <div key={agent.agent_id} onClick={() => selectAgent(agent.agent_id)}
                    style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "10px 12px", background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.04)", borderRadius: 6,
                      cursor: "pointer", transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.05)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.02)"; }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: agent.currentTask ? "#4DFFB8" : "rgba(255,255,255,0.1)", flexShrink: 0 }} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontFamily: body, fontSize: 13, fontWeight: 500, color: "#E8EDF2", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{agent.name}</div>
                        <div style={{ fontFamily: mono, fontSize: 10, color: "#4A5568" }}>{agent.model}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 12 }}>
                      <div style={{ fontFamily: mono, fontSize: 12, fontWeight: 500, color: "#E8EDF2", whiteSpace: "nowrap" }}>{agent.reputation_score.toLocaleString()} rep</div>
                      {agent.currentTask && <div style={{ fontFamily: mono, fontSize: 10, color: "#4DFFB8" }}>working</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
