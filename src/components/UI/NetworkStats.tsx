import { useNetworkStats } from "../../hooks/useApiData";

const mono = "'IBM Plex Mono', monospace";

export default function NetworkStats() {
  const stats = useNetworkStats();
  if (!stats) return null;

  const items = [
    { label: "SETTLEMENTS", value: stats.totalSettlements.toLocaleString() },
    { label: "FEES", value: `${stats.protocolFees} AET` },
    { label: "VALIDATORS", value: stats.activeValidators.toString() },
    { label: "CHALLENGES", value: stats.openChallenges.toString() },
  ];

  return (
    <div style={{
      borderBottom: "1px solid rgba(255,255,255,0.04)",
      backgroundColor: "rgba(10,14,26,0.9)",
    }}>
      <div style={{
        maxWidth: 1400, marginLeft: "auto", marginRight: "auto",
        paddingLeft: 32, paddingRight: 32,
        display: "flex", gap: 32, paddingTop: 8, paddingBottom: 8,
      }}>
        {items.map((s) => (
          <div key={s.label} style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontFamily: mono, fontSize: 10, color: "#4A5568", letterSpacing: "0.1em" }}>{s.label}</span>
            <span style={{ fontFamily: mono, fontSize: 13, fontWeight: 600, color: "#E8EDF2" }}>{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
