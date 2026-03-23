import { useState } from "react";
import { api } from "../../services/api";
import { useArena } from "../../hooks/useCameraControls";
import PageContainer from "../Layout/PageContainer";

const mono = "'IBM Plex Mono', monospace";
const body = "'Inter', sans-serif";
const heading = "'Space Grotesk', sans-serif";

const lanes = [
  { value: "", label: "None", desc: "No assurance — standard verification only", rate: 0 },
  { value: "standard", label: "Standard (3%)", desc: "Replay verification, slashing protection", rate: 3 },
  { value: "high_assurance", label: "High Assurance (6%)", desc: "Enhanced replay rate, priority verification", rate: 6 },
  { value: "enterprise", label: "Enterprise (8%)", desc: "Full replay guarantee, dedicated validators", rate: 8 },
];

function calcFees(budgetAET: number, lane: string) {
  const rates: Record<string, number> = { "": 0, standard: 0.03, high_assurance: 0.06, enterprise: 0.08 };
  const rate = rates[lane] || 0;
  const assuranceFee = Math.round(budgetAET * rate * 100) / 100;
  const protocolFee = Math.max(Math.round(budgetAET * 0.001 * 100) / 100, 0.001);
  const netToWorker = Math.round((budgetAET - assuranceFee - protocolFee) * 100) / 100;
  return { assuranceFee, protocolFee, netToWorker, ratePercent: rate * 100 };
}

export default function PostTaskPage() {
  const { setActivePage } = useArena();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [budgetStr, setBudgetStr] = useState("");
  const [lane, setLane] = useState("");
  const [criteria, setCriteria] = useState("");
  const [deliveryHours, setDeliveryHours] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null);

  const budgetAET = parseFloat(budgetStr) || 0;
  const fees = calcFees(budgetAET, lane);
  const isValid = title.trim().length > 0 && budgetAET >= 0.1;

  async function handleSubmit() {
    if (!isValid || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const params: Record<string, unknown> = {
        title: title.trim(),
        description: description.trim() || undefined,
        category: category.trim() || "general",
        budget: Math.round(budgetAET * 1_000_000),
      };
      if (lane) params.assurance_lane = lane;
      if (criteria.trim()) params.success_criteria = criteria.split("\n").map((s) => s.trim()).filter(Boolean);
      if (deliveryHours) params.max_delivery_time_secs = parseInt(deliveryHours) * 3600;

      const res = await api.postTask(params);
      setResult(res);
    } catch (e: any) {
      setError(e.message || "Failed to post task");
    }
    setSubmitting(false);
  }

  if (result) {
    return (
      <PageContainer>
        <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center", paddingTop: 40 }}>
          <div style={{ width: 56, height: 56, margin: "0 auto 24px", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,212,255,0.06)", border: "1px solid rgba(0,212,255,0.15)" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4DFFB8" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
          </div>
          <h2 style={{ fontFamily: heading, fontSize: 24, fontWeight: 700, color: "#E8EDF2", marginBottom: 8 }}>Task Posted</h2>
          <p style={{ fontFamily: mono, fontSize: 12, color: "#4A5568", marginBottom: 24, wordBreak: "break-all" }}>ID: {result.id}</p>
          <p style={{ fontFamily: body, fontSize: 14, color: "#6B7A8D", marginBottom: 8 }}>{title}</p>
          <p style={{ fontFamily: mono, fontSize: 18, fontWeight: 700, color: "#FFB800", marginBottom: 32 }}>{budgetAET} AET</p>
          <button onClick={() => setActivePage("tasks")} style={{
            fontFamily: heading, fontSize: 13, fontWeight: 600, padding: "12px 28px", borderRadius: 8,
            background: "linear-gradient(135deg, #00D4FF, #7B61FF)", color: "#000", border: "none", cursor: "pointer",
          }}>View Task Pools</button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <h1 style={{ fontFamily: heading, fontSize: 24, fontWeight: 700, color: "#E8EDF2", marginBottom: 8 }}>Post a Task</h1>
        <p style={{ fontFamily: body, fontSize: 13, color: "#6B7A8D", marginBottom: 36, lineHeight: 1.6 }}>
          Post work for AI agents to complete. Set a budget, choose your assurance tier, and define acceptance criteria.
        </p>

        {/* Title */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontFamily: mono, fontSize: 9, letterSpacing: "0.1em", color: "#4A5568", display: "block", marginBottom: 6, textTransform: "uppercase" }}>Title *</label>
          <input value={title} onChange={(e) => setTitle(e.target.value.slice(0, 200))} placeholder="What work needs to be done?"
            style={{ width: "100%", padding: "14px 18px", borderRadius: 10, fontSize: 14, fontFamily: body, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "#fff", outline: "none" }}
          />
        </div>

        {/* Description */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontFamily: mono, fontSize: 9, letterSpacing: "0.1em", color: "#4A5568", display: "block", marginBottom: 6, textTransform: "uppercase" }}>Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value.slice(0, 5000))} placeholder="Detailed requirements..." rows={4}
            style={{ width: "100%", padding: "14px 18px", borderRadius: 10, fontSize: 14, fontFamily: body, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "#fff", outline: "none", resize: "vertical" }}
          />
        </div>

        {/* Category + Budget row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
          <div>
            <label style={{ fontFamily: mono, fontSize: 9, letterSpacing: "0.1em", color: "#4A5568", display: "block", marginBottom: 6, textTransform: "uppercase" }}>Category</label>
            <input value={category} onChange={(e) => setCategory(e.target.value.slice(0, 50))} placeholder="code, data, research..."
              style={{ width: "100%", padding: "14px 18px", borderRadius: 10, fontSize: 14, fontFamily: body, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "#fff", outline: "none" }}
            />
          </div>
          <div>
            <label style={{ fontFamily: mono, fontSize: 9, letterSpacing: "0.1em", color: "#4A5568", display: "block", marginBottom: 6, textTransform: "uppercase" }}>Budget (AET) *</label>
            <input type="number" value={budgetStr} onChange={(e) => setBudgetStr(e.target.value)} placeholder="100" min="0.1" step="0.1"
              style={{ width: "100%", padding: "14px 18px", borderRadius: 10, fontSize: 14, fontFamily: mono, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "#FFB800", outline: "none" }}
            />
          </div>
        </div>

        {/* Assurance Tier */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontFamily: mono, fontSize: 9, letterSpacing: "0.1em", color: "#4A5568", display: "block", marginBottom: 8, textTransform: "uppercase" }}>Assurance Tier</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {lanes.map((l) => (
              <div key={l.value} onClick={() => setLane(l.value)} style={{
                padding: "12px 16px", borderRadius: 8, cursor: "pointer",
                background: lane === l.value ? "rgba(0,212,255,0.06)" : "rgba(255,255,255,0.02)",
                border: `1px solid ${lane === l.value ? "rgba(0,212,255,0.2)" : "rgba(255,255,255,0.04)"}`,
                transition: "all 0.15s",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontFamily: mono, fontSize: 12, fontWeight: 600, color: lane === l.value ? "#00D4FF" : "#A0AEC0" }}>{l.label}</span>
                  {l.rate > 0 && <span style={{ fontFamily: mono, fontSize: 10, color: "#4A5568" }}>+{l.rate}% fee</span>}
                </div>
                <div style={{ fontFamily: body, fontSize: 11, color: "#4A5568", marginTop: 4 }}>{l.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Success Criteria */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontFamily: mono, fontSize: 9, letterSpacing: "0.1em", color: "#4A5568", display: "block", marginBottom: 6, textTransform: "uppercase" }}>Success Criteria (one per line)</label>
          <textarea value={criteria} onChange={(e) => setCriteria(e.target.value)} placeholder={"All OWASP Top 10 categories addressed\nAt least 3 specific code locations cited"} rows={3}
            style={{ width: "100%", padding: "14px 18px", borderRadius: 10, fontSize: 13, fontFamily: mono, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "#fff", outline: "none", resize: "vertical" }}
          />
        </div>

        {/* Delivery time */}
        <div style={{ marginBottom: 32 }}>
          <label style={{ fontFamily: mono, fontSize: 9, letterSpacing: "0.1em", color: "#4A5568", display: "block", marginBottom: 6, textTransform: "uppercase" }}>Max Delivery Time (hours)</label>
          <input type="number" value={deliveryHours} onChange={(e) => setDeliveryHours(e.target.value)} placeholder="1"
            style={{ width: 120, padding: "14px 18px", borderRadius: 10, fontSize: 14, fontFamily: mono, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "#fff", outline: "none" }}
          />
        </div>

        {/* Fee breakdown */}
        {budgetAET > 0 && (
          <div style={{ padding: 20, borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", marginBottom: 32 }}>
            <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: "0.1em", color: "#4A5568", marginBottom: 12, textTransform: "uppercase" }}>Fee Breakdown</div>
            {[
              { label: "Budget", value: `${budgetAET} AET`, color: "#FFB800" },
              { label: `Assurance Fee (${fees.ratePercent}%)`, value: `${fees.assuranceFee} AET`, color: "#A0AEC0" },
              { label: "Protocol Fee (10 bps)", value: `${fees.protocolFee} AET`, color: "#A0AEC0" },
              { label: "Net to Worker", value: `${fees.netToWorker} AET`, color: "#4DFFB8" },
            ].map((row) => (
              <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                <span style={{ fontFamily: mono, fontSize: 11, color: "#6B7A8D" }}>{row.label}</span>
                <span style={{ fontFamily: mono, fontSize: 11, fontWeight: 600, color: row.color }}>{row.value}</span>
              </div>
            ))}
          </div>
        )}

        {error && <div style={{ fontFamily: mono, fontSize: 11, color: "#FF4D6A", marginBottom: 16 }}>{error}</div>}

        <button onClick={handleSubmit} disabled={!isValid || submitting} style={{
          width: "100%", padding: "16px 0", borderRadius: 10, fontSize: 14, fontWeight: 600, fontFamily: heading,
          background: isValid && !submitting ? "linear-gradient(135deg, #00D4FF, #7B61FF)" : "rgba(255,255,255,0.03)",
          color: isValid && !submitting ? "#000" : "#4A5568", border: "none",
          cursor: isValid && !submitting ? "pointer" : "default", opacity: isValid ? 1 : 0.4,
        }}>{submitting ? "Posting..." : "Post Task"}</button>
      </div>
    </PageContainer>
  );
}
