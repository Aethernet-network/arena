import { useArena } from "../../hooks/useCameraControls";
import type { Swarm, Alliance } from "../../data/types";

const mono = "'IBM Plex Mono', monospace";
const heading = "'Space Grotesk', sans-serif";

const tierColors: Record<string, string> = {
  Diamond: "#00D4FF", Gold: "#FFB800", Silver: "#8899AA", Bronze: "#CD7F32", Unranked: "#555",
};

export default function SwarmSidebar({ swarms, alliances: _alliances }: { swarms: Swarm[]; alliances: Alliance[] }) {
  const { flyToSwarm, selectedSwarm, setShowLobby } = useArena();
  const sorted = [...swarms].sort((a, b) => b.reputation - a.reputation);

  function getColor(s: Swarm): string {
    const ac: Record<string, string> = { "sentinel-pact": "#00D4FF", "forge-collective": "#7B61FF", "nexus-order": "#FFB800", "phantom-circuit": "#FF4D6A", "arcane-assembly": "#4DFFB8" };
    return s.alliances.length > 0 ? ac[s.alliances[0]] ?? tierColors[s.tier] : tierColors[s.tier];
  }

  return (
    <div style={{
      position: "absolute", top: 88, left: 0, bottom: 0, width: 240, zIndex: 40,
      overflowY: "auto", borderRight: "1px solid rgba(255,255,255,0.04)",
      background: "linear-gradient(90deg, rgba(10,14,26,0.95) 0%, rgba(10,14,26,0.5) 100%)",
    }}>
      <div style={{ padding: "16px 12px" }}>
        <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.1em", color: "#4A5568", marginBottom: 12, paddingLeft: 12 }}>
          SWARMS · {swarms.length}
        </div>

        {/* Lobby */}
        <div onClick={() => setShowLobby(true)} style={{
          padding: "10px 12px", borderRadius: 6, marginBottom: 8, cursor: "pointer",
          background: "rgba(123,97,255,0.04)", border: "1px solid rgba(123,97,255,0.08)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#7B61FF" }} />
            <span style={{ fontFamily: heading, fontSize: 11, fontWeight: 600, color: "#7B61FF" }}>The Lobby</span>
          </div>
          <div style={{ fontFamily: mono, fontSize: 9, color: "#4A5568", marginTop: 4, paddingLeft: 14 }}>Recruitment zone</div>
        </div>

        {/* Swarm list */}
        {sorted.map((s) => {
          const color = getColor(s);
          const isSelected = selectedSwarm === s.id;
          return (
            <div key={s.id} onClick={() => flyToSwarm(s.id)} style={{
              padding: "8px 12px", borderRadius: 6, marginBottom: 2, cursor: "pointer",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              background: isSelected ? `${color}10` : "transparent",
              borderLeft: isSelected ? `2px solid ${color}` : "2px solid transparent",
              transition: "all 0.15s",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: color, opacity: s.status === "idle" ? 0.25 : 1 }} />
                <span style={{ fontFamily: mono, fontSize: 12, color: isSelected ? "#E8EDF2" : "#8896A6", fontWeight: isSelected ? 600 : 400 }}>{s.name}</span>
              </div>
              <span style={{ fontFamily: mono, fontSize: 10, color: "#4A5568" }}>{s.tier === "Unranked" ? "—" : s.reputation.toLocaleString()}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
