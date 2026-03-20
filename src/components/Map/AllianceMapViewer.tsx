import { useCallback, useMemo, useState, useEffect, useRef } from "react";
import { Canvas, useThree, invalidate } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import Terrain from "./Terrain";
import SwarmSettlement from "./SwarmSettlement";
import AgentNode from "./AgentNode";
import LobbyZone from "./LobbyZone";
import AllianceConnection from "./AllianceConnection";
import MapParticles from "./MapParticles";
import CameraController from "./CameraController";
import { getTerrainY } from "./SwarmSettlement";
import TopBar from "../UI/TopBar";
import NetworkStats from "../UI/NetworkStats";
import LiveFeed from "../UI/LiveFeed";
import Breadcrumb from "../UI/Breadcrumb";
import SwarmSidebar from "../UI/SwarmSidebar";
import MapControls from "../UI/MapControls";
import SwarmPanel from "../Panels/SwarmPanel";
import AgentPanel from "../Panels/AgentPanel";
import LobbyPanel from "../Panels/LobbyPanel";
import LeaderboardPage from "../Pages/LeaderboardPage";
import TaskPoolsPage from "../Pages/TaskPoolsPage";
import MySwarmPage from "../Pages/MySwarmPage";
import LandingPage from "../Pages/LandingPage";
import { useSwarms, useAlliances, useLobbyAgents } from "../../hooks/useApiData";
import { useTerrainGeneration, TERRAIN_SIZE } from "../../hooks/useTerrainGeneration";
import { ArenaContext, type ArenaState } from "../../hooks/useCameraControls";
import type { ZoomLevel, Page, Alliance, Swarm } from "../../data/types";

function getAllianceConnections(alliances: Alliance[], swarms: Swarm[]) {
  const connections: { from: { x: number; z: number }; to: { x: number; z: number }; color: string }[] = [];
  const colors: Record<string, string> = {
    "sentinel-pact": "#00D4FF", "forge-collective": "#7B61FF",
    "nexus-order": "#FFB800", "phantom-circuit": "#FF4D6A", "arcane-assembly": "#4DFFB8",
  };
  for (const al of alliances) {
    const members = al.swarmIds.map((id) => swarms.find((s) => s.id === id)).filter(Boolean) as Swarm[];
    const c = colors[al.id] ?? "#00D4FF";
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        connections.push({ from: members[i].territory, to: members[j].territory, color: c });
      }
    }
  }
  return connections;
}

function getSwarmColor(s: Swarm): string {
  const colors: Record<string, string> = {
    "sentinel-pact": "#00D4FF", "forge-collective": "#7B61FF", "nexus-order": "#FFB800",
    "phantom-circuit": "#FF4D6A", "arcane-assembly": "#4DFFB8",
  };
  const tierColors: Record<string, string> = {
    Diamond: "#00D4FF", Gold: "#FFB800", Silver: "#8899AA", Bronze: "#CD7F32", Unranked: "#555",
  };
  return s.alliances.length > 0 ? (colors[s.alliances[0]] ?? tierColors[s.tier]) : tierColors[s.tier];
}

function SceneContent({ swarms, alliances, lobbyAgents, zoomLevel, selectedSwarm, selectedAgent, showLobby, flyTarget, onFlyComplete, controlsRef }: {
  swarms: Swarm[]; alliances: Alliance[]; lobbyAgents: any[]; zoomLevel: ZoomLevel; selectedSwarm: string | null; selectedAgent: string | null; showLobby: boolean;
  flyTarget: { position: THREE.Vector3; lookAt: THREE.Vector3 } | null; onFlyComplete: () => void; controlsRef: React.MutableRefObject<OrbitControlsImpl | null>;
}) {
  const swarmPositions = useMemo(() => swarms.map((s) => ({ x: s.territory.x, z: s.territory.z, rep: s.reputation })), [swarms]);
  const { geometry, heights, minHeight, maxHeight, terrainSize, segments } = useTerrainGeneration(swarmPositions);
  const connections = useMemo(() => getAllianceConnections(alliances, swarms), [alliances, swarms]);
  const selectedSwarmData = useMemo(() => swarms.find((s) => s.id === selectedSwarm) ?? null, [swarms, selectedSwarm]);

  const swarmCenter = useMemo((): [number, number, number] => {
    if (!selectedSwarmData) return [0, 0, 0];
    const x = (selectedSwarmData.territory.x - 0.5) * TERRAIN_SIZE;
    const z = (selectedSwarmData.territory.z - 0.5) * TERRAIN_SIZE;
    const y = getTerrainY(x, z, heights, segments, TERRAIN_SIZE);
    return [x, y, z];
  }, [selectedSwarmData, heights, segments]);

  return (
    <>
      <ambientLight intensity={0.12} />
      <directionalLight position={[20, 30, 15]} intensity={0.2} color="#00D4FF" />
      <directionalLight position={[-15, 20, -10]} intensity={0.1} color="#7B61FF" />

      <Terrain geometry={geometry} heights={heights} minHeight={minHeight} maxHeight={maxHeight} terrainSize={terrainSize} segments={segments} />
      <MapParticles terrainSize={terrainSize} />

      {zoomLevel === 1 && connections.map((c, i) => (
        <AllianceConnection key={i} from={c.from} to={c.to} color={c.color} heights={heights} segments={segments} />
      ))}

      {swarms.map((swarm) => (
        <SwarmSettlement key={swarm.id} swarm={swarm} heights={heights} segments={segments} allianceColor={getSwarmColor(swarm)} />
      ))}

      {zoomLevel >= 2 && selectedSwarmData && selectedSwarmData.agents.map((agent, i) => (
        <AgentNode key={agent.agent_id} agent={agent} index={i} total={selectedSwarmData.agents.length} center={swarmCenter} color={getSwarmColor(selectedSwarmData)} />
      ))}

      <LobbyZone lobbyAgents={lobbyAgents} heights={heights} segments={segments} />

      <CameraController
        zoomLevel={zoomLevel} selectedSwarm={selectedSwarm} selectedAgent={selectedAgent} showLobby={showLobby}
        swarms={swarms} heights={heights} segments={segments} flyTarget={flyTarget} onFlyComplete={onFlyComplete}
        controlsRef={controlsRef}
      />

      {/* Single OrbitControls — CameraController lerps its .target, no fighting */}
      <OrbitControls
        ref={controlsRef as any}
        enableDamping dampingFactor={0.08}
        maxPolarAngle={Math.PI / 2.2} minDistance={3} maxDistance={80} enablePan
        mouseButtons={{ LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN }}
      />

      <EffectComposer>
        <Bloom luminanceThreshold={0.15} luminanceSmoothing={0.9} intensity={1.0} mipmapBlur />
        <Vignette eskil={false} offset={0.25} darkness={0.7} />
      </EffectComposer>
    </>
  );
}

function ForceRender() {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    gl.render(scene, camera);
    gl.setAnimationLoop(() => { gl.render(scene, camera); });
    return () => { gl.setAnimationLoop(null); };
  }, [gl, scene, camera]);
  return null;
}

function MapPreloader() {
  return (
    <>
      <style>{`
        @keyframes preloaderPulse {
          0%, 100% { opacity: 0.3; transform: scale(0.9); }
          50% { opacity: 1; transform: scale(1.1); }
        }
        @keyframes preloaderBar {
          0% { width: 0%; margin-left: 0%; }
          50% { width: 50%; margin-left: 25%; }
          100% { width: 0%; margin-left: 100%; }
        }
      `}</style>
      <div style={{
        width: "100%", height: "100%", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", backgroundColor: "#0A0E1A", gap: 28,
      }}>
        <div style={{ animation: "preloaderPulse 2s ease-in-out infinite" }}>
          <svg width="48" height="48" viewBox="0 0 32 32">
            <defs><linearGradient id="preloaderGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#00D4FF" /><stop offset="100%" stopColor="#7B61FF" /></linearGradient></defs>
            <polygon points="16,2 30,28 2,28" fill="none" stroke="url(#preloaderGrad)" strokeWidth="2" />
          </svg>
        </div>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: "0.2em", color: "#4A5568" }}>GENERATING TERRAIN</div>
        <div style={{ width: 180, height: 2, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 1, overflow: "hidden" }}>
          <div style={{ height: "100%", backgroundColor: "#00D4FF", borderRadius: 1, animation: "preloaderBar 1.5s ease-in-out infinite" }} />
        </div>
      </div>
    </>
  );
}

export default function AllianceMapViewer() {
  const swarms = useSwarms();
  const alliances = useAlliances();
  const lobbyAgents = useLobbyAgents();
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>(1);
  const [selectedSwarm, setSelectedSwarm] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [showLobby, setShowLobby] = useState(false);
  const [activePage, setActivePage] = useState<Page>("landing");
  const [flyTarget, setFlyTarget] = useState<{ position: THREE.Vector3; lookAt: THREE.Vector3 } | null>(null);

  // Preloader: simple timer — show for 1.5s then reveal map. Cannot deadlock.
  const [showMap, setShowMap] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShowMap(true), 1500);
    return () => clearTimeout(t);
  }, []);

  // Force Three.js to render on mount — fixes "blank until tab switch" bug
  useEffect(() => {
    const t = setTimeout(() => {
      invalidate();
      window.dispatchEvent(new Event("resize"));
    }, 100);
    return () => clearTimeout(t);
  }, []);

  const selectSwarm = useCallback((id: string | null) => {
    setSelectedSwarm(id);
    setSelectedAgent(null);
    setShowLobby(false);
    setZoomLevel(id ? 2 : 1);
  }, []);

  const selectAgent = useCallback((id: string | null) => {
    setSelectedAgent(id);
    setZoomLevel(id ? 3 : 2);
  }, []);

  const goBack = useCallback(() => {
    if (showLobby) { setShowLobby(false); return; }
    if (zoomLevel === 3) { setSelectedAgent(null); setZoomLevel(2); }
    else if (zoomLevel === 2) { setSelectedSwarm(null); setSelectedAgent(null); setZoomLevel(1); }
  }, [zoomLevel, showLobby]);

  const recenter = useCallback(() => {
    setSelectedSwarm(null);
    setSelectedAgent(null);
    setShowLobby(false);
    setZoomLevel(1);
    setFlyTarget({ position: new THREE.Vector3(0, 50, 40), lookAt: new THREE.Vector3(0, 0, 0) });
  }, []);

  const flyToSwarm = useCallback((id: string) => {
    setSelectedAgent(null);
    setShowLobby(false);
    setSelectedSwarm(id);
    setZoomLevel(2);
  }, []);

  const onFlyComplete = useCallback(() => setFlyTarget(null), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (activePage !== "map" && activePage !== "landing") setActivePage("map");
        else goBack();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goBack, activePage]);

  const arenaState: ArenaState = useMemo(() => ({
    zoomLevel, selectedSwarm, selectedAgent, showLobby, activePage,
    selectSwarm, selectAgent, setShowLobby, goBack, recenter, flyToSwarm, setActivePage,
  }), [zoomLevel, selectedSwarm, selectedAgent, showLobby, activePage, selectSwarm, selectAgent, goBack, recenter, flyToSwarm]);

  // Non-map pages use a scrollable layout; map page uses full viewport with absolute overlays
  const isMapPage = activePage === "map";
  const isLanding = activePage === "landing";
  const isContentPage = !isMapPage && !isLanding;

  return (
    <ArenaContext.Provider value={arenaState}>
      {/* Landing page — full standalone */}
      {isLanding && <LandingPage />}

      {/* Map page — full viewport with preloader + 3D canvas */}
      {isMapPage && (
        <div style={{ position: "relative", width: "100vw", height: "100vh", overflow: "hidden", background: "#0A0E1A" }}>
          {/* Preloader overlay — zIndex 9999 guarantees above Canvas */}
          {!showMap && (
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
              zIndex: 9999, backgroundColor: "#0A0E1A",
            }}>
              <MapPreloader />
            </div>
          )}

          {/* Canvas — always mounted, fades in when ready */}
          <div style={{
            position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
            opacity: showMap ? 1 : 0,
            transition: "opacity 0.8s ease",
          }}>
            <Canvas camera={{ position: [0, 50, 40], fov: 50, near: 0.1, far: 300 }}
              frameloop="always"
              gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
              style={{ width: "100%", height: "100%", background: "#0A0E1A" }}
            >
              <ForceRender />
              <color attach="background" args={["#0A0E1A"]} />
              <fog attach="fog" args={["#0A0E1A", 50, 120]} />
              {swarms.length > 0 && (
                <SceneContent swarms={swarms} alliances={alliances} lobbyAgents={lobbyAgents}
                  zoomLevel={zoomLevel} selectedSwarm={selectedSwarm} selectedAgent={selectedAgent} showLobby={showLobby}
                  flyTarget={flyTarget} onFlyComplete={onFlyComplete} controlsRef={controlsRef}
                />
              )}
            </Canvas>
          </div>

          {/* Map overlays — absolutely positioned, only visible when map is ready */}
          {showMap && (
            <>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 10 }}>
                <TopBar />
                <NetworkStats />
              </div>
              <div style={{ position: "absolute", top: 88, left: 0, zIndex: 10 }}><Breadcrumb swarms={swarms} /></div>
              <SwarmSidebar swarms={swarms} alliances={alliances} />
              <MapControls />
              <div style={{ transition: "opacity 0.5s", opacity: zoomLevel === 1 && !showLobby ? 1 : 0, pointerEvents: zoomLevel === 1 && !showLobby ? "auto" : "none" }}>
                <LiveFeed />
              </div>
              <SwarmPanel swarms={swarms} alliances={alliances} />
              <AgentPanel swarms={swarms} />
              <LobbyPanel />
            </>
          )}
        </div>
      )}

      {/* Content pages — scrollable with sticky header */}
      {isContentPage && (
        <div style={{ width: "100vw", height: "100vh", overflow: "auto", background: "#0A0E1A" }}>
          <TopBar />
          <NetworkStats />
          {activePage === "leaderboard" && <LeaderboardPage />}
          {activePage === "tasks" && <TaskPoolsPage />}
          {activePage === "swarm" && <MySwarmPage />}
        </div>
      )}
    </ArenaContext.Provider>
  );
}
