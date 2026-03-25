import { useState, useEffect } from "react";
import { useTaskPools } from "../../hooks/useApiData";
import { api, isMock } from "../../services/api";
import { useArena } from "../../hooks/useCameraControls";
import PageContainer from "../Layout/PageContainer";

const mono = "'IBM Plex Mono', monospace";
const body = "'Inter', sans-serif";
const heading = "'Space Grotesk', sans-serif";

const statusColors: Record<string, string> = { open: "#00D4FF", in_progress: "#FFB800", completed: "#4DFFB8", disputed: "#FF4D6A", claimed: "#FFB800", submitted: "#FF8C00" };
const statusLabels: Record<string, string> = { open: "Open", in_progress: "In Progress", completed: "Completed", disputed: "Disputed", claimed: "In Progress", submitted: "Under Review" };
const laneRates: Record<string, number> = { Standard: 0.03, "High Assurance": 0.06, Enterprise: 0.08, standard: 0.03, high_assurance: 0.06, enterprise: 0.08 };

function short(id: string) { return id && id.length > 16 ? id.slice(0, 8) + "…" + id.slice(-6) : id || "—"; }

function TaskDetail({ taskId, onClose }: { taskId: string; onClose: () => void }) {
  const [task, setTask] = useState<any>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getTask(taskId).then((t) => {
      setTask(t);
      if (t && (t.status === "completed" || t.status === "submitted")) {
        api.getTaskResult(taskId).then(setResult).catch(() => {});
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [taskId]);

  if (loading) return <div style={{ padding: 20, fontFamily: mono, fontSize: 11, color: "#4A5568" }}>Loading task details...</div>;
  if (!task) return <div style={{ padding: 20, fontFamily: mono, fontSize: 11, color: "#4A5568" }}>Task not found (mock mode)</div>;

  const budget = (task.budget || 0) / 1_000_000;
  const rate = laneRates[task.assurance_lane] || 0;
  const assuranceFee = Math.round(budget * rate * 100) / 100;
  const protocolFee = Math.max(Math.round(budget * 0.001 * 100) / 100, 0.001);
  const netWorker = Math.round((budget - assuranceFee - protocolFee) * 100) / 100;
  const score = task.verification_score;

  return (
    <div style={{ padding: "20px 28px", background: "rgba(0,212,255,0.02)", borderTop: "1px solid rgba(0,212,255,0.08)", marginTop: -1 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <span style={{ fontFamily: mono, fontSize: 9, letterSpacing: "0.1em", color: "#4A5568", textTransform: "uppercase" }}>Task Detail</span>
        <button onClick={onClose} style={{ fontFamily: mono, fontSize: 10, color: "#6B7A8D", background: "none", border: "none", cursor: "pointer" }}>Close ×</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Left: info */}
        <div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: mono, fontSize: 8, color: "#4A5568", marginBottom: 4, textTransform: "uppercase" }}>Task ID</div>
            <div style={{ fontFamily: mono, fontSize: 10, color: "#6B7A8D", wordBreak: "break-all" }}>{task.id}</div>
          </div>
          {task.poster_id && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: mono, fontSize: 8, color: "#4A5568", marginBottom: 4, textTransform: "uppercase" }}>Poster</div>
              <div style={{ fontFamily: mono, fontSize: 10, color: "#6B7A8D" }}>{short(task.poster_id)}</div>
            </div>
          )}
          {task.claimer_id && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: mono, fontSize: 8, color: "#4A5568", marginBottom: 4, textTransform: "uppercase" }}>Worker</div>
              <div style={{ fontFamily: mono, fontSize: 10, color: "#6B7A8D" }}>{short(task.claimer_id)}</div>
            </div>
          )}
          {task.contract?.success_criteria?.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: mono, fontSize: 8, color: "#4A5568", marginBottom: 6, textTransform: "uppercase" }}>Acceptance Criteria</div>
              {task.contract.success_criteria.map((c: string, i: number) => (
                <div key={i} style={{ fontFamily: body, fontSize: 11, color: "#6B7A8D", marginBottom: 4, paddingLeft: 8, borderLeft: "2px solid rgba(255,255,255,0.04)" }}>{c}</div>
              ))}
            </div>
          )}
          {result?.result_note && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: mono, fontSize: 8, color: "#4A5568", marginBottom: 4, textTransform: "uppercase" }}>Result Note</div>
              <div style={{ fontFamily: body, fontSize: 12, color: "#A0AEC0", lineHeight: 1.6 }}>{result.result_note}</div>
            </div>
          )}
          {task.result_hash && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: mono, fontSize: 8, color: "#4A5568", marginBottom: 4, textTransform: "uppercase" }}>Evidence Hash</div>
              <div style={{ fontFamily: mono, fontSize: 9, color: "#6B7A8D", wordBreak: "break-all", padding: 8, background: "rgba(255,255,255,0.015)", borderRadius: 4 }}>{task.result_hash}</div>
            </div>
          )}
        </div>

        {/* Right: economics + verification */}
        <div>
          {/* Fee breakdown */}
          <div style={{ padding: 16, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 8, marginBottom: 16 }}>
            <div style={{ fontFamily: mono, fontSize: 8, color: "#4A5568", marginBottom: 10, textTransform: "uppercase" }}>Fee Breakdown</div>
            {[
              { label: "Budget", value: `${budget} AET`, color: "#FFB800" },
              { label: `Assurance (${(rate * 100).toFixed(0)}%)`, value: `${assuranceFee} AET`, color: "#A0AEC0" },
              { label: "Protocol (10 bps)", value: `${protocolFee} AET`, color: "#A0AEC0" },
              { label: "Net to Worker", value: `${netWorker} AET`, color: "#4DFFB8" },
            ].map((r) => (
              <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}>
                <span style={{ fontFamily: mono, fontSize: 10, color: "#6B7A8D" }}>{r.label}</span>
                <span style={{ fontFamily: mono, fontSize: 10, fontWeight: 600, color: r.color }}>{r.value}</span>
              </div>
            ))}
          </div>

          {/* Verification score */}
          {score && (
            <div style={{ padding: 16, background: "rgba(77,255,184,0.03)", border: "1px solid rgba(77,255,184,0.08)", borderRadius: 8, marginBottom: 16 }}>
              <div style={{ fontFamily: mono, fontSize: 8, color: "#4A5568", marginBottom: 10, textTransform: "uppercase" }}>Verification Score</div>
              {[
                { label: "Overall", value: score.overall, color: "#4DFFB8" },
                { label: "Relevance", value: score.relevance, color: "#A0AEC0" },
                { label: "Completeness", value: score.completeness, color: "#A0AEC0" },
                { label: "Quality", value: score.quality, color: "#A0AEC0" },
              ].map((s) => (
                <div key={s.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3px 0" }}>
                  <span style={{ fontFamily: mono, fontSize: 10, color: "#6B7A8D" }}>{s.label}</span>
                  <span style={{ fontFamily: mono, fontSize: 12, fontWeight: 600, color: s.color }}>{Math.round((s.value || 0) * 100)}%</span>
                </div>
              ))}
            </div>
          )}

          {/* Status info */}
          <div style={{ fontFamily: mono, fontSize: 10, color: "#4A5568" }}>
            <div style={{ marginBottom: 4 }}>Status: <span style={{ color: statusColors[task.status] || "#6B7A8D" }}>{(task.status || "").replace("_", " ").toUpperCase()}</span></div>
            {task.assurance_lane && <div style={{ marginBottom: 4 }}>Lane: {task.assurance_lane.replace("_", " ")}</div>}
            {task.delivery_method && <div>Delivery: {task.delivery_method}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TaskPoolsPage() {
  const { setActivePage } = useArena();
  const tasks = useTaskPools();
  const [filter, setFilter] = useState("all");
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const filtered = filter === "all" ? tasks : tasks.filter((t) => t.status === filter);

  return (
    <PageContainer>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: heading, fontSize: 24, fontWeight: 700, color: "#E8EDF2", marginBottom: 8 }}>Task Pools</h1>
          <p style={{ fontFamily: body, fontSize: 13, color: "#6B7A8D", lineHeight: 1.6 }}>Browse verified work opportunities. Click a task for details.</p>
        </div>
        <button onClick={() => setActivePage("post-task")} style={{
          fontFamily: heading, fontSize: 12, fontWeight: 600, padding: "10px 24px", borderRadius: 8,
          background: "linear-gradient(135deg, #00D4FF, #7B61FF)", color: "#000", border: "none", cursor: "pointer",
        }}>Post Task</button>
      </div>

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

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ fontFamily: body, fontSize: 15, color: "#6B7A8D", marginBottom: 16 }}>No tasks yet. Be the first to post one!</div>
          <button onClick={() => setActivePage("post-task")} style={{
            fontFamily: heading, fontSize: 13, fontWeight: 600, padding: "12px 28px", borderRadius: 8,
            background: "linear-gradient(135deg, #00D4FF, #7B61FF)", color: "#000", border: "none", cursor: "pointer",
          }}>Post a Task</button>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {filtered.map((task) => {
          const rate = laneRates[task.assuranceTier] ?? 0.03;
          const fee = Math.max(2, task.bounty * rate);
          const net = +(task.bounty - fee).toFixed(2);
          const isExpanded = expandedTask === task.id;

          return (
            <div key={task.id}>
              <div onClick={() => setExpandedTask(isExpanded ? null : task.id)} style={{
                display: "flex", justifyContent: "space-between", padding: "24px 28px", gap: 40, cursor: "pointer",
                backgroundColor: isExpanded ? "rgba(0,212,255,0.03)" : "rgba(255,255,255,0.02)",
                border: `1px solid ${isExpanded ? "rgba(0,212,255,0.15)" : task.status === "open" ? "rgba(0,212,255,0.1)" : "rgba(255,255,255,0.05)"}`,
                borderRadius: isExpanded ? "8px 8px 0 0" : 8, transition: "all 0.15s",
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <span style={{ fontFamily: heading, fontSize: 14, fontWeight: 600, color: "#E8EDF2" }}>{task.name}</span>
                    <span style={{ fontFamily: mono, fontSize: 9, letterSpacing: "0.1em", padding: "3px 8px", borderRadius: 4, color: statusColors[task.status] ?? "#4A5568", background: `${statusColors[task.status] ?? "#4A5568"}12` }}>{statusLabels[task.status] || task.status.replace("_", " ")}</span>
                  </div>
                  <p style={{ fontFamily: body, fontSize: 13, lineHeight: 1.7, color: "#6B7A8D", marginBottom: 12, maxWidth: 500 }}>{task.description}</p>
                  <div style={{ display: "flex", gap: 16, fontFamily: mono, fontSize: 10, color: "#4A5568" }}>
                    <span>{task.category}</span>
                    {task.assignedSwarm && <span style={{ color: "#6B7A8D" }}>Worker: {short(task.assignedSwarm)}</span>}
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
                  <div>
                    <div style={{ fontFamily: mono, fontSize: 8, letterSpacing: "0.1em", color: "#4A5568", marginBottom: 4, textTransform: "uppercase" }}>Assurance</div>
                    <div style={{ fontFamily: mono, fontSize: 11, color: "#A0AEC0" }}>{task.assuranceTier} ({task.assuranceFee}%)</div>
                  </div>
                </div>
              </div>

              {/* Expanded detail view */}
              {isExpanded && !isMock && <TaskDetail taskId={task.id} onClose={() => setExpandedTask(null)} />}
              {isExpanded && isMock && (
                <div style={{ padding: "20px 28px", background: "rgba(0,212,255,0.02)", borderTop: "1px solid rgba(0,212,255,0.08)", borderRadius: "0 0 8px 8px", fontFamily: mono, fontSize: 11, color: "#4A5568" }}>
                  Task detail view available when connected to testnet. Contract: {task.acceptanceContract}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </PageContainer>
  );
}
