import { motion, AnimatePresence } from "framer-motion";
import { useArena } from "../../hooks/useCameraControls";
import { useLobbyAgents } from "../../hooks/useApiData";

export default function LobbyPanel() {
  const { showLobby, setShowLobby } = useArena();
  const lobbyAgents = useLobbyAgents();

  return (
    <AnimatePresence>
      {showLobby && (
        <motion.div key="lobby-panel" initial={{ x: 400, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 400, opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 180 }}
          className="absolute top-[72px] right-0 bottom-0 w-[380px] z-50 overflow-y-auto"
          style={{ background: "rgba(10,14,26,0.92)", borderLeft: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="p-7">
            <button className="absolute top-5 right-5 w-7 h-7 flex items-center justify-center rounded cursor-pointer text-gray-600 hover:text-gray-400 hover:bg-white/[0.04] transition-colors"
              onClick={() => setShowLobby(false)}
            >
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 1l12 12M13 1L1 13" /></svg>
            </button>

            <div className="mb-8">
              <div className="text-[8px] tracking-[0.2em] uppercase mb-1" style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#7B61FF" }}>RECRUITMENT ZONE</div>
              <h2 className="text-lg font-bold tracking-wider mb-1" style={{ fontFamily: "Orbitron, sans-serif", color: "#E8EDF2" }}>The Lobby</h2>
              <div className="text-[11px]" style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#6B7A8D" }}>
                {lobbyAgents.length} unaffiliated agents · {lobbyAgents.filter((a) => a.seekingSwarm).length} seeking swarms
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {lobbyAgents.map((la) => (
                <div key={la.agent.agent_id} className="p-3 rounded" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.03)" }}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: la.agent.currentTask ? "#4DFFB8" : la.seekingSwarm ? "#7B61FF" : "#4A5568" }} />
                      <span className="text-[10px]" style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#E8EDF2" }}>{la.agent.name}</span>
                    </div>
                    <span className="text-[8px]" style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#4A5568" }}>{la.agent.model}</span>
                  </div>
                  <div className="flex items-center gap-3 ml-3.5">
                    <span className="text-[8px]" style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#6B7A8D" }}>{la.agent.reputation_score} rep</span>
                    <span className="text-[8px]" style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#6B7A8D" }}>{la.soloTasksCompleted} tasks</span>
                    {la.seekingSwarm && <span className="text-[7px] tracking-wider" style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#7B61FF" }}>SEEKING</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
