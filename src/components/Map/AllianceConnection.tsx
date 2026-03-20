import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import * as THREE from "three";
import { TERRAIN_SIZE } from "../../hooks/useTerrainGeneration";

function getTerrainY(x: number, z: number, heights: number[], segments: number): number {
  const half = TERRAIN_SIZE / 2;
  const ix = Math.floor(((x + half) / TERRAIN_SIZE) * segments);
  const iz = Math.floor(((z + half) / TERRAIN_SIZE) * segments);
  return heights[Math.max(0, Math.min(segments, iz)) * (segments + 1) + Math.max(0, Math.min(segments, ix))] ?? 0;
}

export default function AllianceConnection({ from, to, color, heights, segments }: {
  from: { x: number; z: number }; to: { x: number; z: number }; color: string; heights: number[]; segments: number;
}) {
  const particleRef = useRef<THREE.Points>(null!);

  const { curvePoints, curve } = useMemo(() => {
    const x1 = (from.x - 0.5) * TERRAIN_SIZE;
    const z1 = (from.z - 0.5) * TERRAIN_SIZE;
    const x2 = (to.x - 0.5) * TERRAIN_SIZE;
    const z2 = (to.z - 0.5) * TERRAIN_SIZE;
    const steps = 24;
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = x1 + (x2 - x1) * t;
      const z = z1 + (z2 - z1) * t;
      const y = getTerrainY(x, z, heights, segments) + 0.2;
      pts.push(new THREE.Vector3(x, y, z));
    }
    const c = new THREE.CatmullRomCurve3(pts);
    return { curvePoints: c.getPoints(48).map((p) => [p.x, p.y, p.z] as [number, number, number]), curve: c };
  }, [from, to, heights, segments]);

  const count = 12;
  const offsets = useMemo(() => Array.from({ length: count }, () => Math.random()), []);
  const positions = useMemo(() => new Float32Array(count * 3), []);

  useFrame(({ clock }) => {
    if (!particleRef.current) return;
    const t = clock.getElapsedTime() * 0.12;
    const pos = particleRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;
    for (let i = 0; i < count; i++) {
      const p = (offsets[i] + t) % 1;
      const point = curve.getPoint(p);
      arr[i * 3] = point.x;
      arr[i * 3 + 1] = point.y;
      arr[i * 3 + 2] = point.z;
    }
    pos.needsUpdate = true;
  });

  return (
    <group>
      <Line points={curvePoints} color={color} lineWidth={0.8} transparent opacity={0.12} dashed dashSize={0.4} gapSize={0.3} />
      <points ref={particleRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial color={color} size={0.08} transparent opacity={0.5} sizeAttenuation depthWrite={false} />
      </points>
    </group>
  );
}
