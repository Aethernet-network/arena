import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import type { ZoomLevel, Swarm } from "../../data/types";
import { TERRAIN_SIZE } from "../../hooks/useTerrainGeneration";
import { getTerrainY } from "./SwarmSettlement";
import { LOBBY_POSITION } from "../../data/mockData";

interface Props {
  zoomLevel: ZoomLevel;
  selectedSwarm: string | null;
  selectedAgent: string | null;
  showLobby: boolean;
  swarms: Swarm[];
  heights: number[];
  segments: number;
  flyTarget: { position: THREE.Vector3; lookAt: THREE.Vector3 } | null;
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
  const isFlying = useRef(false);

  function computeTarget() {
    const panelOpen = (zoomLevel >= 2 && selectedSwarm) || showLobby;
    const offsetX = panelOpen ? -4 : 0;

    if (showLobby) {
      const lx = (LOBBY_POSITION.x - 0.5) * TERRAIN_SIZE;
      const lz = (LOBBY_POSITION.z - 0.5) * TERRAIN_SIZE;
      const ly = getTerrainY(lx, lz, heights, segments, TERRAIN_SIZE);
      return { position: new THREE.Vector3(lx + offsetX, ly + 14, lz + 12), lookAt: new THREE.Vector3(lx + offsetX, ly, lz) };
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
          return { position: new THREE.Vector3(ax + offsetX, y + 3.5, az + 3), lookAt: new THREE.Vector3(ax + offsetX * 0.5, y + 0.2, az) };
        }
      }

      return { position: new THREE.Vector3(x + offsetX, y + 9, z + 7), lookAt: new THREE.Vector3(x + offsetX * 0.5, y, z) };
    }

    return null;
  }

  // Cancel fly when user grabs orbit controls
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const cancel = () => { isFlying.current = false; };
    controls.addEventListener("start", cancel);
    return () => controls.removeEventListener("start", cancel);
  }, [controlsRef.current]);

  // Explicit flyTarget (recenter button)
  useEffect(() => {
    if (!flyTarget) return;
    targetPos.current.copy(flyTarget.position);
    targetLookAt.current.copy(flyTarget.lookAt);
    isFlying.current = true;
  }, [flyTarget]);

  // Selection changes — START a fly animation (but it will STOP on arrival)
  useEffect(() => {
    const target = computeTarget();
    if (target) {
      targetPos.current.copy(target.position);
      targetLookAt.current.copy(target.lookAt);
      isFlying.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoomLevel, selectedSwarm, selectedAgent, showLobby]);

  // Fly animation — ONLY runs while isFlying is true, stops on arrival
  useFrame(() => {
    if (!isFlying.current) return;

    const controls = controlsRef.current;
    if (!controls) return;

    camera.position.lerp(targetPos.current, 0.04);
    controls.target.lerp(targetLookAt.current, 0.04);
    controls.update();

    const posDist = camera.position.distanceTo(targetPos.current);
    const lookDist = controls.target.distanceTo(targetLookAt.current);

    if (posDist < 0.15 && lookDist < 0.15) {
      camera.position.copy(targetPos.current);
      controls.target.copy(targetLookAt.current);
      controls.update();
      isFlying.current = false; // DONE — release camera to user
      onFlyComplete();
    }
  });

  return null;
}
