import { useRef, useMemo } from "react";
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

export default function SwarmSettlement({ swarm, heights, segments, allianceColor }: {
  swarm: Swarm; heights: number[]; segments: number; allianceColor?: string;
}) {
  const { flyToSwarm, zoomLevel, selectedSwarm } = useArena();
  const meshRef = useRef<THREE.Mesh>(null!);
  const pulseRef = useRef<THREE.Mesh>(null!);

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
    if (meshRef.current) {
      meshRef.current.rotation.y = clock.getElapsedTime() * 0.2;
    }
    if (pulseRef.current) {
      const t = (clock.getElapsedTime() % 4) / 4;
      pulseRef.current.scale.setScalar(1 + t * 3);
      (pulseRef.current.material as THREE.MeshBasicMaterial).opacity = (swarm.status === "idle" ? 0.05 : 0.2) * (1 - t);
    }
  });

  const dimmed = zoomLevel >= 2 && !isSelected;
  const opacity = dimmed ? 0.15 : swarm.status === "idle" ? 0.4 : 0.8;

  return (
    <group position={worldPos} onClick={(e) => { e.stopPropagation(); flyToSwarm(swarm.id); }}>
      {/* Core node */}
      <mesh ref={meshRef}>
        <octahedronGeometry args={[nodeSize, 0]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={dimmed ? 0.05 : 0.4} transparent opacity={opacity} roughness={0.3} metalness={0.7} />
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

      {/* Label — only at Level 1 or if selected */}
      {(zoomLevel === 1 || isSelected) && !dimmed && (
        <Html position={[0, beaconH + 0.4, 0]} center distanceFactor={40} style={{ pointerEvents: "none", userSelect: "none" }}>
          <div className="flex flex-col items-center gap-px">
            <div className="text-[9px] font-bold tracking-widest uppercase whitespace-nowrap" style={{ fontFamily: "Orbitron, sans-serif", color, textShadow: `0 0 8px ${color}` }}>
              {swarm.name}
            </div>
            <div className="text-[7px] whitespace-nowrap" style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#6B7A8D" }}>
              {swarm.specialization} · {swarm.tier}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

export { getTerrainY };
