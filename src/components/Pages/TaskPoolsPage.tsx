import { useState } from "react";
import { useTaskPools } from "../../hooks/useApiData";
import PageContainer from "../Layout/PageContainer";

const mono = "'IBM Plex Mono', monospace";
const body = "'Inter', sans-serif";
const heading = "'Space Grotesk', sans-serif";

const statusColors: Record<string, string> = { open: "#00D4FF", in_progress: "#FFB800", completed: "#4DFFB8", disputed: "#FF4D6A" };
const laneRates: Record<string, number> = { Standard: 0.03, "High Assurance": 0.06, Enterprise: 0.08 };

export default function TaskPoolsPage() {
  const tasks = useTaskPools();
  const [filter, setFilter] = useState("all");
  const filtered = filter === "all" ? tasks : tasks.filter((t) => t.status === filter);

  return (
    <PageContainer>
      <h1 style={{ fontFamily: heading, fontSize: 24, fontWeight: 700, color: "#E8EDF2", marginBottom: 8 }}>Task Pools</h1>
      <p style={{ fontFamily: body, fontSize: 13, color: "#6B7A8D", marginBottom: 32, lineHeight: 1.6 }}>Browse verified work opportunities. Budget shown is total — your net payout is after the assurance fee.</p>

      <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
        {["all", "open", "in_progress", "completed"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} style={{
            fontFamily: mono, fontSize: 12, fontWeight: filter === f ? 600 : 400,
            color: filter === f ? "#00D4FF" : "#6B7A8D",
            background: filter === f ? "rgba(0,212,255,0.08)" : "transparent",
            border: `1px solid ${filter === f ? "rgba(0,212,255,0.2)" : "transparent"}`,
            padding: "6px 16px", borderRadius: 6, cursor: "pointer",
          }}>{f === "all" ? `All (${tasks.length})` : f.replace("_", " ").toUpperCase()}</button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {filtered.map((task) => {
          const rate = laneRates[task.assuranceTier] ?? 0.03;
          const fee = Math.max(2, task.bounty * rate);
          const net = +(task.bounty - fee).toFixed(2);
          return (
            <div key={task.id} style={{
              display: "flex", justifyContent: "space-between", padding: "24px 28px", gap: 40,
              backgroundColor: "rgba(255,255,255,0.02)", border: `1px solid ${task.status === "open" ? "rgba(0,212,255,0.1)" : "rgba(255,255,255,0.05)"}`, borderRadius: 8,
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <span style={{ fontFamily: heading, fontSize: 14, fontWeight: 600, color: "#E8EDF2" }}>{task.name}</span>
                  <span style={{ fontFamily: mono, fontSize: 9, letterSpacing: "0.1em", padding: "3px 8px", borderRadius: 4, color: statusColors[task.status] ?? "#4A5568", background: `${statusColors[task.status] ?? "#4A5568"}12`, textTransform: "uppercase" }}>{task.status.replace("_", " ")}</span>
                </div>
                <p style={{ fontFamily: body, fontSize: 13, lineHeight: 1.7, color: "#6B7A8D", marginBottom: 12, maxWidth: 500 }}>{task.description}</p>
                <p style={{ fontFamily: body, fontSize: 11, color: "#4A5568" }}><span style={{ fontFamily: mono, letterSpacing: "0.08em", textTransform: "uppercase" }}>Contract: </span>{task.acceptanceContract}</p>
                <div style={{ display: "flex", gap: 16, marginTop: 12, fontFamily: mono, fontSize: 10, color: "#4A5568" }}>
                  <span>{task.category}</span>
                  {task.assignedSwarm && <span style={{ color: "#6B7A8D" }}>Assigned: {task.assignedSwarm}</span>}
                </div>
              </div>
              <div style={{ width: 160, flexShrink: 0, borderLeft: "1px solid rgba(255,255,255,0.04)", paddingLeft: 24 }}>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontFamily: mono, fontSize: 8, letterSpacing: "0.1em", color: "#4A5568", marginBottom: 4, textTransform: "uppercase" }}>Budget</div>
                  <div style={{ fontFamily: mono, fontSize: 20, fontWeight: 700, color: "#FFB800" }}>{task.bounty} AET</div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontFamily: mono, fontSize: 8, letterSpacing: "0.1em", color: "#4A5568", marginBottom: 4, textTransform: "uppercase" }}>Net Payout</div>
                  <div style={{ fontFamily: mono, fontSize: 14, fontWeight: 600, color: "#4DFFB8" }}>{net} AET</div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontFamily: mono, fontSize: 8, letterSpacing: "0.1em", color: "#4A5568", marginBottom: 4, textTransform: "uppercase" }}>Assurance</div>
                  <div style={{ fontFamily: mono, fontSize: 11, color: "#A0AEC0" }}>{task.assuranceTier} ({task.assuranceFee}%)</div>
                </div>
                <div>
                  <div style={{ fontFamily: mono, fontSize: 8, letterSpacing: "0.1em", color: "#4A5568", marginBottom: 4, textTransform: "uppercase" }}>Deadline</div>
                  <div style={{ fontFamily: mono, fontSize: 11, color: task.deadline === "Completed" ? "#4DFFB8" : "#A0AEC0" }}>{task.deadline}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </PageContainer>
  );
}
