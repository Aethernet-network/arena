import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const CONTOUR_LEVELS = 6;

function ContourLines({ heights, minHeight, maxHeight, terrainSize, segments }: {
  heights: number[]; minHeight: number; maxHeight: number; terrainSize: number; segments: number;
}) {
  const lines = useMemo(() => {
    const result: { geometry: THREE.BufferGeometry; intensity: number }[] = [];
    const step = (maxHeight - minHeight) / CONTOUR_LEVELS;
    const cellSize = terrainSize / segments;
    const half = terrainSize / 2;

    for (let c = 1; c < CONTOUR_LEVELS; c++) {
      const level = minHeight + c * step;
      const intensity = c / CONTOUR_LEVELS;
      const points: number[] = [];

      for (let iz = 0; iz < segments; iz++) {
        for (let ix = 0; ix < segments; ix++) {
          const i00 = iz * (segments + 1) + ix;
          const i10 = iz * (segments + 1) + ix + 1;
          const i01 = (iz + 1) * (segments + 1) + ix;
          const h00 = heights[i00], h10 = heights[i10], h01 = heights[i01];

          if ((h00 - level) * (h10 - level) < 0) {
            const t = (level - h00) / (h10 - h00);
            points.push(-half + (ix + t) * cellSize, level + 0.05, -half + iz * cellSize);
          }
          if ((h00 - level) * (h01 - level) < 0) {
            const t = (level - h00) / (h01 - h00);
            points.push(-half + ix * cellSize, level + 0.05, -half + (iz + t) * cellSize);
          }
        }
      }

      if (points.length > 0) {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
        result.push({ geometry: geo, intensity });
      }
    }
    return result;
  }, [heights, minHeight, maxHeight, terrainSize, segments]);

  return (
    <>
      {lines.map((line, i) => (
        <points key={i} geometry={line.geometry}>
          <pointsMaterial color="#00D4FF" size={0.03} transparent opacity={0.1 + line.intensity * 0.4} sizeAttenuation depthWrite={false} />
        </points>
      ))}
    </>
  );
}

function GridOverlay({ terrainSize }: { terrainSize: number }) {
  const gridGeo = useMemo(() => {
    const points: number[] = [];
    const half = terrainSize / 2;
    const step = terrainSize / 16;

    for (let i = -half; i <= half; i += step) {
      points.push(i, 0.02, -half, i, 0.02, half);
      points.push(-half, 0.02, i, half, 0.02, i);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
    return geo;
  }, [terrainSize]);

  return (
    <lineSegments geometry={gridGeo}>
      <lineBasicMaterial color="#00D4FF" transparent opacity={0.02} depthWrite={false} />
    </lineSegments>
  );
}

export default function Terrain({ geometry, heights, minHeight, maxHeight, terrainSize, segments }: {
  geometry: THREE.PlaneGeometry; heights: number[]; minHeight: number; maxHeight: number; terrainSize: number; segments: number;
}) {
  return (
    <group>
      <mesh geometry={geometry} receiveShadow>
        <meshStandardMaterial color="#0A0E1A" roughness={0.95} metalness={0.05} />
      </mesh>
      <mesh geometry={geometry}>
        <meshBasicMaterial color="#00D4FF" wireframe transparent opacity={0.012} depthWrite={false} />
      </mesh>
      <ContourLines heights={heights} minHeight={minHeight} maxHeight={maxHeight} terrainSize={terrainSize} segments={segments} />
      <GridOverlay terrainSize={terrainSize} />
    </group>
  );
}
