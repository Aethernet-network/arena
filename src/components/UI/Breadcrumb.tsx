import { useArena } from "../../hooks/useCameraControls";
import type { Swarm } from "../../data/types";

const mono = "'IBM Plex Mono', monospace";

export default function Breadcrumb({ swarms }: { swarms: Swarm[] }) {
  const { zoomLevel, selectedSwarm, selectedAgent, showLobby, selectAgent, recenter } = useArena();

  if (zoomLevel === 1 && !showLobby) return null;

  const swarm = swarms.find((s) => s.id === selectedSwarm);
  const agent = swarm?.agents.find((a) => a.agent_id === selectedAgent);

  return (
    <div style={{ position: "absolute", top: 92, left: 256, zIndex: 50, display: "flex", alignItems: "center", gap: 8, fontFamily: mono }}>
      <button onClick={recenter} style={{ fontSize: 10, letterSpacing: "0.08em", color: "rgba(255,255,255,0.2)", cursor: "pointer", background: "none", border: "none" }}>NETWORK</button>
      {showLobby && (
        <><span style={{ fontSize: 10, color: "rgba(255,255,255,0.08)" }}>/</span><span style={{ fontSize: 10, color: "#7B61FF" }}>LOBBY</span></>
      )}
      {swarm && (
        <><span style={{ fontSize: 10, color: "rgba(255,255,255,0.08)" }}>/</span>
        <button onClick={() => { if (agent) selectAgent(null); }} style={{ fontSize: 10, color: !agent ? "#E8EDF2" : "rgba(255,255,255,0.2)", cursor: "pointer", background: "none", border: "none" }}>{swarm.name.toUpperCase()}</button></>
      )}
      {agent && (
        <><span style={{ fontSize: 10, color: "rgba(255,255,255,0.08)" }}>/</span><span style={{ fontSize: 10, color: "#E8EDF2" }}>{agent.name.toUpperCase()}</span></>
      )}
    </div>
  );
}
