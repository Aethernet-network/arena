import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { LobbyAgent } from "../../data/types";
import { useArena } from "../../hooks/useCameraControls";
import { TERRAIN_SIZE } from "../../hooks/useTerrainGeneration";
import { LOBBY_POSITION, LOBBY_RADIUS } from "../../data/mockData";

export default function LobbyZone({ lobbyAgents, heights, segments }: {
  lobbyAgents: LobbyAgent[]; heights: number[]; segments: number;
}) {
  const { setShowLobby, zoomLevel } = useArena();
  const ringRef = useRef<THREE.Mesh>(null!);
  const particlesRef = useRef<THREE.Points>(null!);

  const cx = (LOBBY_POSITION.x - 0.5) * TERRAIN_SIZE;
  const cz = (LOBBY_POSITION.z - 0.5) * TERRAIN_SIZE;
  const lobbyWorldRadius = LOBBY_RADIUS * TERRAIN_SIZE;

  // Get terrain height at lobby center
  const half = TERRAIN_SIZE / 2;
  const ix = Math.floor(((cx + half) / TERRAIN_SIZE) * segments);
  const iz = Math.floor(((cz + half) / TERRAIN_SIZE) * segments);
  const cy = heights[Math.max(0, Math.min(segments, iz)) * (segments + 1) + Math.max(0, Math.min(segments, ix))] ?? 0;

  const particlePositions = useMemo(() => {
    const count = lobbyAgents.length * 3 + 50;
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * lobbyWorldRadius;
      arr[i * 3] = cx + Math.cos(angle) * r;
      arr[i * 3 + 1] = cy + 0.1 + Math.random() * 1.5;
      arr[i * 3 + 2] = cz + Math.sin(angle) * r;
    }
    return arr;
  }, [cx, cz, cy, lobbyWorldRadius, lobbyAgents.length]);

  useFrame(({ clock }) => {
    if (ringRef.current) {
      const t = (clock.getElapsedTime() % 5) / 5;
      ringRef.current.scale.setScalar(0.8 + t * 0.4);
      (ringRef.current.material as THREE.MeshBasicMaterial).opacity = 0.08 * (1 - t);
    }
    if (particlesRef.current) {
      const pos = particlesRef.current.geometry.attributes.position as THREE.BufferAttribute;
      const arr = pos.array as Float32Array;
      const count = arr.length / 3;
      for (let i = 0; i < count; i++) {
        arr[i * 3 + 1] += Math.sin(clock.getElapsedTime() + i * 0.5) * 0.001;
      }
      pos.needsUpdate = true;
    }
  });

  return (
    <group onClick={(e) => { e.stopPropagation(); setShowLobby(true); }}>
      {/* Ground ring marker */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, cy + 0.05, cz]}>
        <ringGeometry args={[lobbyWorldRadius - 0.3, lobbyWorldRadius, 48]} />
        <meshBasicMaterial color="#7B61FF" transparent opacity={0.1} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>

      {/* Pulse ring */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[cx, cy + 0.06, cz]}>
        <ringGeometry args={[lobbyWorldRadius - 0.5, lobbyWorldRadius - 0.2, 48]} />
        <meshBasicMaterial color="#7B61FF" transparent opacity={0.08} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>

      {/* Lobby particles — busier than normal terrain to suggest activity */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[particlePositions, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#7B61FF" size={0.08} transparent opacity={0.35} sizeAttenuation depthWrite={false} />
      </points>

      {/* Label */}
      {zoomLevel === 1 && (
        <Html position={[cx, cy + 2.5, cz]} center distanceFactor={40} zIndexRange={[1, 0]} style={{ pointerEvents: "none", userSelect: "none" }}>
          <div className="flex flex-col items-center gap-px">
            <div className="text-[9px] font-bold tracking-[0.2em] uppercase whitespace-nowrap" style={{ fontFamily: "Orbitron, sans-serif", color: "#7B61FF", textShadow: "0 0 8px rgba(123,97,255,0.5)" }}>
              THE LOBBY
            </div>
            <div className="text-[7px] whitespace-nowrap" style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#6B7A8D" }}>
              {lobbyAgents.length} agents · recruitment zone
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}
