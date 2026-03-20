import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function MapParticles({ terrainSize }: { terrainSize: number }) {
  const ref = useRef<THREE.Points>(null!);
  const count = 600;

  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    const half = terrainSize / 2;
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * terrainSize;
      pos[i * 3 + 1] = Math.random() * 4 + 0.3;
      pos[i * 3 + 2] = (Math.random() - 0.5) * terrainSize;
      vel[i * 3] = (Math.random() - 0.5) * 0.0015;
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.0008;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.0015;
    }
    return { positions: pos, velocities: vel };
  }, [terrainSize]);

  useFrame(() => {
    if (!ref.current) return;
    const pos = ref.current.geometry.attributes.position as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;
    const half = terrainSize / 2;
    for (let i = 0; i < count; i++) {
      arr[i * 3] += velocities[i * 3];
      arr[i * 3 + 1] += velocities[i * 3 + 1];
      arr[i * 3 + 2] += velocities[i * 3 + 2];
      if (Math.abs(arr[i * 3]) > half) velocities[i * 3] *= -1;
      if (arr[i * 3 + 1] < 0.2 || arr[i * 3 + 1] > 5) velocities[i * 3 + 1] *= -1;
      if (Math.abs(arr[i * 3 + 2]) > half) velocities[i * 3 + 2] *= -1;
    }
    pos.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color="#00D4FF" size={0.05} transparent opacity={0.2} sizeAttenuation depthWrite={false} />
    </points>
  );
}
