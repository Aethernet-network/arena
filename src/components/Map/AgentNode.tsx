import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { AgentProfile } from "../../data/types";
import { useArena } from "../../hooks/useCameraControls";

export default function AgentNode({ agent, index, total, center, color }: {
  agent: AgentProfile; index: number; total: number; center: [number, number, number]; color: string;
}) {
  const { selectAgent, zoomLevel, selectedAgent } = useArena();
  const ref = useRef<THREE.Mesh>(null!);

  const angle = (index / total) * Math.PI * 2;
  const radius = 1.8;
  const pos: [number, number, number] = [
    center[0] + Math.cos(angle) * radius,
    center[1] + 0.2,
    center[2] + Math.sin(angle) * radius,
  ];

  const isActive = agent.currentTask !== null;
  const isSelected = selectedAgent === agent.agent_id;

  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.position.y = pos[1] + Math.sin(clock.getElapsedTime() * 1.5 + index) * 0.04;
  });

  return (
    <group
      position={pos}
      onClick={(e) => {
        e.stopPropagation();
        selectAgent(agent.agent_id);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "";
      }}
    >
      <mesh ref={ref}>
        <boxGeometry args={[0.12, 0.12, 0.12]} />
        <meshStandardMaterial
          color={isActive ? color : "#4A5568"}
          emissive={isActive ? color : "#222"}
          emissiveIntensity={isSelected ? 1.0 : isActive ? 0.4 : 0.05}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Selection ring */}
      {isSelected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
          <ringGeometry args={[0.15, 0.18, 16]} />
          <meshBasicMaterial color={color} transparent opacity={0.5} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      )}

      {zoomLevel >= 2 && (
        <Html position={[0, 0.3, 0]} center distanceFactor={8} zIndexRange={[1, 0]} style={{ pointerEvents: "none", userSelect: "none" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{
              fontFamily: "Orbitron, sans-serif", fontSize: 7, fontWeight: 700,
              letterSpacing: "0.05em", whiteSpace: "nowrap",
              color: isSelected ? color : "#E8EDF2",
              textShadow: isSelected ? `0 0 6px ${color}` : "none",
            }}>{agent.name}</div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 6, whiteSpace: "nowrap", color: "#6B7A8D" }}>{agent.model}</div>
          </div>
        </Html>
      )}
    </group>
  );
}
