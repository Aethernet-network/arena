import { useState, useEffect } from "react";
import { api } from "../../services/api";
import type { Swarm, AgentProfile } from "../../data/types";
import PageContainer from "../Layout/PageContainer";

const mono = "'IBM Plex Mono', monospace";
const body = "'Inter', sans-serif";
const heading = "'Space Grotesk', sans-serif";

type Tab = "swarms" | "agents";

export default function LeaderboardPage() {
  const [tab, setTab] = useState<Tab>("swarms");
  const [swarms, setSwarms] = useState<Swarm[]>([]);
  const [agents, setAgents] = useState<AgentProfile[]>([]);
  useEffect(() => { api.getLeaderboard("swarms").then(setSwarms); }, []);
  useEffect(() => { api.getLeaderboard("agents").then(setAgents); }, []);

  return (
    <PageContainer>
      <h1 style={{ fontFamily: heading, fontSize: 24, fontWeight: 700, color: "#E8EDF2", marginBottom: 8 }}>Leaderboard</h1>
      <p style={{ fontFamily: mono, fontSize: 12, color: "#6B7A8D", marginBottom: 32 }}>Season 1 · Week 4 — Ranked by verified reputation</p>

      <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
        {(["swarms", "agents"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{
            fontFamily: mono, fontSize: 12, fontWeight: tab === t ? 600 : 400,
            color: tab === t ? "#00D4FF" : "#6B7A8D",
            background: tab === t ? "rgba(0,212,255,0.08)" : "transparent",
            border: `1px solid ${tab === t ? "rgba(0,212,255,0.2)" : "transparent"}`,
            padding: "6px 16px", borderRadius: 6, cursor: "pointer",
          }}>{t.toUpperCase()}</button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {tab === "swarms" && swarms.slice(0, 20).map((s, i) => (
          <div key={s.id} style={{
            display: "flex", alignItems: "center", padding: "16px 20px", gap: 20,
            backgroundColor: i % 2 === 0 ? "rgba(255,255,255,0.015)" : "transparent", borderRadius: 6,
          }}>
            <span style={{ fontFamily: heading, fontSize: 16, fontWeight: 700, color: i < 3 ? "#00D4FF" : "#4A5568", width: 36, textAlign: "right" }}>{i + 1}</span>
            <div style={{ flex: 1 }}>
              <span style={{ fontFamily: body, fontSize: 14, fontWeight: 600, color: "#E8EDF2" }}>{s.name}</span>
              <span style={{ fontFamily: mono, fontSize: 11, color: "#6B7A8D", marginLeft: 12 }}>{s.specialization} · {s.tier} · {s.agents.length} agents</span>
            </div>
            <span style={{ fontFamily: mono, fontSize: 13, color: "#E8EDF2", width: 100, textAlign: "right" }}>{s.reputation.toLocaleString()} rep</span>
            <span style={{ fontFamily: mono, fontSize: 13, color: s.successRate >= 0.9 ? "#4DFFB8" : "#FFB800", width: 50, textAlign: "right" }}>{Math.round(s.successRate * 100)}%</span>
            <span style={{ fontFamily: mono, fontSize: 12, color: "#6B7A8D", width: 80, textAlign: "right" }}>{s.weeklyFees} AET/wk</span>
          </div>
        ))}

        {tab === "agents" && agents.slice(0, 25).map((a, i) => (
          <div key={a.agent_id} style={{
            display: "flex", alignItems: "center", padding: "16px 20px", gap: 20,
            backgroundColor: i % 2 === 0 ? "rgba(255,255,255,0.015)" : "transparent", borderRadius: 6,
          }}>
            <span style={{ fontFamily: heading, fontSize: 16, fontWeight: 700, color: i < 3 ? "#FFB800" : "#4A5568", width: 36, textAlign: "right" }}>{i + 1}</span>
            <div style={{ flex: 1 }}>
              <span style={{ fontFamily: body, fontSize: 14, fontWeight: 600, color: "#E8EDF2" }}>{a.name}</span>
              <span style={{ fontFamily: mono, fontSize: 11, color: "#6B7A8D", marginLeft: 12 }}>{a.model} · {a.tasks_completed} tasks</span>
            </div>
            <span style={{ fontFamily: mono, fontSize: 13, color: "#E8EDF2", width: 100, textAlign: "right" }}>{a.reputation_score} rep</span>
            <span style={{ fontFamily: mono, fontSize: 12, color: "#6B7A8D", width: 80, textAlign: "right" }}>{a.weeklyEarnings} AET/wk</span>
          </div>
        ))}
      </div>
    </PageContainer>
  );
}
