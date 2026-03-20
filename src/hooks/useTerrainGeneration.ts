import { useMemo } from "react";
import { createNoise2D } from "simplex-noise";
import * as THREE from "three";

export const TERRAIN_SIZE = 100;
const SEGMENTS = 96; // 96×96 = 9,409 vertices — fast, still looks good

function gaussianBump(x: number, z: number, cx: number, cz: number, amplitude: number, sigma: number): number {
  const dx = x - cx;
  const dz = z - cz;
  return amplitude * Math.exp(-(dx * dx + dz * dz) / (2 * sigma * sigma));
}

export function useTerrainGeneration(swarmPositions: { x: number; z: number; rep: number }[]) {
  return useMemo(() => {
    const noise2D = createNoise2D();
    const geometry = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, SEGMENTS, SEGMENTS);
    geometry.rotateX(-Math.PI / 2);

    const positions = geometry.attributes.position;
    const heights: number[] = [];

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);

      // 2 octaves of noise — plenty for visual quality
      let height = 0;
      height += noise2D(x * 0.04, z * 0.04) * 2.5;
      height += noise2D(x * 0.1, z * 0.1) * 1.0;

      // Gaussian peaks at swarm settlements
      for (const pos of swarmPositions) {
        const sx = (pos.x - 0.5) * TERRAIN_SIZE;
        const sz = (pos.z - 0.5) * TERRAIN_SIZE;
        // Skip if too far (> 20 units) — major perf optimization
        const dist = (x - sx) * (x - sx) + (z - sz) * (z - sz);
        if (dist > 400) continue;
        const repFactor = Math.min(pos.rep / 10000, 1);
        height += gaussianBump(x, z, sx, sz, 2.0 * repFactor + 0.8, 5.0);
      }

      // Lobby depression
      const lobbyX = 0;
      const lobbyZ = (0.42 - 0.5) * TERRAIN_SIZE;
      const lobbyDist = (x - lobbyX) * (x - lobbyX) + (z - lobbyZ) * (z - lobbyZ);
      if (lobbyDist < 64) {
        height -= (1 - Math.sqrt(lobbyDist) / 8) * 1.5;
      }

      // Edge falloff
      const edgeDist = Math.max(Math.abs(x) / (TERRAIN_SIZE / 2), Math.abs(z) / (TERRAIN_SIZE / 2));
      if (edgeDist > 0.7) {
        height *= 1 - Math.pow((edgeDist - 0.7) / 0.3, 2);
      }

      positions.setY(i, height);
      heights.push(height);
    }

    geometry.computeVertexNormals();

    let minHeight = Infinity;
    let maxHeight = -Infinity;
    for (let i = 0; i < heights.length; i++) {
      if (heights[i] < minHeight) minHeight = heights[i];
      if (heights[i] > maxHeight) maxHeight = heights[i];
    }

    return { geometry, heights, minHeight, maxHeight, terrainSize: TERRAIN_SIZE, segments: SEGMENTS };
  }, [swarmPositions]);
}
