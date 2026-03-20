import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import type { ZoomLevel, Swarm } from "../../data/types";
import { TERRAIN_SIZE } from "../../hooks/useTerrainGeneration";
import { getTerrainY } from "./SwarmSettlement";
import { LOBBY_POSITION } from "../../data/mockData";

interface CameraTarget {
  position: THREE.Vector3;
  lookAt: THREE.Vector3;
}

interface Props {
  zoomLevel: ZoomLevel;
  selectedSwarm: string | null;
  selectedAgent: string | null;
  showLobby: boolean;
  swarms: Swarm[];
  heights: number[];
  segments: number;
  flyTarget: CameraTarget | null;
  onFlyComplete: () => void;
  controlsRef: React.MutableRefObject<OrbitControlsImpl | null>;
}

export default function CameraController({
  zoomLevel, selectedSwarm, selectedAgent, showLobby,
  swarms, heights, segments, flyTarget, onFlyComplete, controlsRef,
}: Props) {
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3(0, 50, 40));
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const isAnimating = useRef(false);
  const hasReached = useRef(false);

  function computeTarget(): CameraTarget | null {
    // When a right panel is open, offset the look-at point left so the entity
    // appears centered in the REMAINING viewport (screen width minus 400px panel).
    // At typical zoom distances, ~4 world units ≈ half the panel width in screen space.
    const panelOpen = (zoomLevel >= 2 && selectedSwarm) || showLobby;
    const offsetX = panelOpen ? -4 : 0;

    if (showLobby) {
      const lx = (LOBBY_POSITION.x - 0.5) * TERRAIN_SIZE;
      const lz = (LOBBY_POSITION.z - 0.5) * TERRAIN_SIZE;
      const ly = getTerrainY(lx, lz, heights, segments, TERRAIN_SIZE);
      return {
        position: new THREE.Vector3(lx + offsetX, ly + 14, lz + 12),
        lookAt: new THREE.Vector3(lx + offsetX, ly, lz),
      };
    }

    if (zoomLevel >= 2 && selectedSwarm) {
      const s = swarms.find((sw) => sw.id === selectedSwarm);
      if (!s) return null;
      const x = (s.territory.x - 0.5) * TERRAIN_SIZE;
      const z = (s.territory.z - 0.5) * TERRAIN_SIZE;
      const y = getTerrainY(x, z, heights, segments, TERRAIN_SIZE);

      if (zoomLevel === 3 && selectedAgent) {
        const agentIdx = s.agents.findIndex((a) => a.agent_id === selectedAgent);
        if (agentIdx >= 0) {
          const angle = (agentIdx / s.agents.length) * Math.PI * 2;
          const ax = x + Math.cos(angle) * 1.8;
          const az = z + Math.sin(angle) * 1.8;
          return {
            position: new THREE.Vector3(ax + offsetX, y + 3.5, az + 3),
            lookAt: new THREE.Vector3(ax + offsetX * 0.5, y + 0.2, az),
          };
        }
      }

      // Level 2 — swarm centered. Camera positioned so the swarm is visually centered
      // in the available viewport (left of the panel)
      return {
        position: new THREE.Vector3(x + offsetX, y + 9, z + 7),
        lookAt: new THREE.Vector3(x + offsetX * 0.5, y, z),
      };
    }

    return null;
  }

  // Handle explicit flyTarget (recenter button)
  useEffect(() => {
    if (!flyTarget) return;
    targetPos.current.copy(flyTarget.position);
    targetLookAt.current.copy(flyTarget.lookAt);
    isAnimating.current = true;
    hasReached.current = false;
  }, [flyTarget]);

  // Handle selection state changes — compute new camera target
  useEffect(() => {
    const target = computeTarget();
    if (target) {
      targetPos.current.copy(target.position);
      targetLookAt.current.copy(target.lookAt);
      isAnimating.current = true;
      hasReached.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoomLevel, selectedSwarm, selectedAgent, showLobby]);

  useFrame(() => {
    if (!isAnimating.current) return;

    const controls = controlsRef.current;

    // Lerp camera position toward target
    camera.position.lerp(targetPos.current, 0.04);

    // Lerp the OrbitControls target — this is the fix for the snap bug.
    // We never call camera.lookAt() directly. OrbitControls owns the look-at direction.
    if (controls) {
      controls.target.lerp(targetLookAt.current, 0.04);
      controls.update();
    }

    // Check if close enough to snap
    const posDist = camera.position.distanceTo(targetPos.current);
    const lookDist = controls ? controls.target.distanceTo(targetLookAt.current) : 0;

    if (posDist < 0.05 && lookDist < 0.05 && !hasReached.current) {
      // Snap to exact final position to prevent any drift
      camera.position.copy(targetPos.current);
      if (controls) {
        controls.target.copy(targetLookAt.current);
        controls.update();
      }
      isAnimating.current = false;
      hasReached.current = true;
      onFlyComplete();
    }
  });

  return null;
}
