import { useRef, useMemo, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { Swarm } from "../../data/types";
import { useArena } from "../../hooks/useCameraControls";
import { TERRAIN_SIZE } from "../../hooks/useTerrainGeneration";

const tierColors: Record<string, string> = {
  Diamond: "#00D4FF", Gold: "#FFB800", Silver: "#8899AA", Bronze: "#CD7F32", Unranked: "#555555",
};

function getTerrainY(x: number, z: number, heights: number[], segments: number, terrainSize: number): number {
  const half = terrainSize / 2;
  const ix = Math.floor(((x + half) / terrainSize) * segments);
  const iz = Math.floor(((z + half) / terrainSize) * segments);
  return heights[Math.max(0, Math.min(segments, iz)) * (segments + 1) + Math.max(0, Math.min(segments, ix))] ?? 0;
}

export default function SwarmSettlement({ swarm, heights, segments, allianceColor, isRecentlyActive, hasDispute }: {
  swarm: Swarm; heights: number[]; segments: number; allianceColor?: string;
  isRecentlyActive?: boolean; hasDispute?: boolean;
}) {
  const { flyToSwarm, zoomLevel, selectedSwarm } = useArena();
  const meshRef = useRef<THREE.Mesh>(null!);
  const pulseRef = useRef<THREE.Mesh>(null!);
  const activityPulseRef = useRef<THREE.MeshBasicMaterial>(null!);
  const [hovered, setHovered] = useState(false);

  const color = allianceColor ?? tierColors[swarm.tier] ?? "#555";
  const isSelected = selectedSwarm === swarm.id;

  const worldPos = useMemo(() => {
    const x = (swarm.territory.x - 0.5) * TERRAIN_SIZE;
    const z = (swarm.territory.z - 0.5) * TERRAIN_SIZE;
    const y = getTerrainY(x, z, heights, segments, TERRAIN_SIZE);
    return [x, y, z] as [number, number, number];
  }, [swarm.territory, heights, segments]);

  const beaconH = 1.5 + (swarm.reputation / 10000) * 6;
  const nodeSize = 0.2 + (swarm.reputation / 10000) * 0.4;

  useFrame(({ clock }) => {
    if (meshRef.current) meshRef.current.rotation.y = clock.getElapsedTime() * 0.2;
    if (pulseRef.current) {
      const t = (clock.getElapsedTime() % 4) / 4;
      pulseRef.current.scale.setScalar(1 + t * 3);
      (pulseRef.current.material as THREE.MeshBasicMaterial).opacity = (swarm.status === "idle" ? 0.05 : 0.2) * (1 - t);
    }
    // Activity pulse
    if (activityPulseRef.current && isRecentlyActive) {
      activityPulseRef.current.opacity = Math.sin(clock.getElapsedTime() * 2) * 0.2 + 0.2;
    }
  });

  const dimmed = zoomLevel >= 2 && !isSelected;
  const opacity = dimmed ? 0.15 : swarm.status === "idle" ? 0.4 : 0.8;
  const activityColor = hasDispute ? "#FF4D6A" : color;

  return (
    <group
      position={worldPos}
      onClick={(e) => { e.stopPropagation(); flyToSwarm(swarm.id); }}
      onPointerEnter={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; }}
      onPointerLeave={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = ""; }}
    >
      {/* Core node */}
      <mesh ref={meshRef}>
        <octahedronGeometry args={[nodeSize, 0]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={dimmed ? 0.05 : hovered ? 0.6 : 0.4} transparent opacity={opacity} roughness={0.3} metalness={0.7} />
      </mesh>

      {/* Beacon pillar */}
      <mesh position={[0, beaconH / 2, 0]}>
        <cylinderGeometry args={[0.04, 0.15, beaconH, 6]} />
        <meshBasicMaterial color={color} transparent opacity={dimmed ? 0.03 : 0.12} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>

      {/* Pulse ring */}
      <mesh ref={pulseRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]}>
        <ringGeometry args={[0.3, 0.35, 24]} />
        <meshBasicMaterial color={color} transparent opacity={0.15} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>

      {/* Activity pulse ring — for recently active swarms */}
      {isRecentlyActive && !dimmed && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
          <ringGeometry args={[1.5, 1.7, 32]} />
          <meshBasicMaterial ref={activityPulseRef} color={activityColor} transparent opacity={0.2} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      )}

      {/* Label — Level 1 or selected */}
      {(zoomLevel === 1 || isSelected) && !dimmed && (
        <Html position={[0, beaconH + 0.4, 0]} center distanceFactor={40} zIndexRange={[1, 0]} style={{ pointerEvents: "none", userSelect: "none" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
            <div style={{ fontFamily: "Orbitron, sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", whiteSpace: "nowrap", color, textShadow: `0 0 8px ${color}` }}>
              {swarm.name}
            </div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 7, whiteSpace: "nowrap", color: "#6B7A8D" }}>
              {swarm.specialization} · {swarm.tier}
            </div>
          </div>
        </Html>
      )}

      {/* Hover tooltip — only when hovered and NOT selected */}
      {hovered && !isSelected && zoomLevel === 1 && (
        <Html position={[0, beaconH + 1.5, 0]} center zIndexRange={[5, 0]} style={{ pointerEvents: "none" }}>
          <div style={{
            backgroundColor: "rgba(10,14,26,0.95)", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8, padding: "12px 16px", minWidth: 180, maxWidth: 220,
            backdropFilter: "blur(8px)", boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
          }}>
            <div style={{ fontFamily: "Orbitron, sans-serif", fontSize: 12, fontWeight: 700, color: "#E8EDF2", marginBottom: 4 }}>{swarm.name}</div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color, marginBottom: 10 }}>{swarm.specialization} · {swarm.tier}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px", fontFamily: "'IBM Plex Mono', monospace", fontSize: 10 }}>
              <div><span style={{ color: "#4A5568" }}>REP </span><span style={{ color: "#E8EDF2", fontWeight: 600 }}>{swarm.reputation.toLocaleString()}</span></div>
              <div><span style={{ color: "#4A5568" }}>AGENTS </span><span style={{ color: "#E8EDF2", fontWeight: 600 }}>{swarm.agents.length}</span></div>
              <div><span style={{ color: "#4A5568" }}>RATE </span><span style={{ color: "#4DFFB8", fontWeight: 600 }}>{Math.round(swarm.successRate * 100)}%</span></div>
              <div><span style={{ color: "#4A5568" }}>FEES </span><span style={{ color: "#FFB800", fontWeight: 600 }}>{swarm.weeklyFees} AET</span></div>
            </div>
            {swarm.alliances.length > 0 && (
              <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.06)", fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: "#4A5568" }}>
                {swarm.alliances.length} alliance{swarm.alliances.length > 1 ? "s" : ""}
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}

export { getTerrainY };
