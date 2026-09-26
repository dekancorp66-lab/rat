import { useMemo } from "react";
import type { HouseModel } from "@/lib/house/types";
import { grassTexture } from "./textures";

export function Terrain({ model }: { model: HouseModel }) {
  const grass = useMemo(() => {
    const t = grassTexture();
    t.repeat.set(18, 18);
    return t;
  }, []);
  const w = model.plot.w * 2.6;
  const l = model.plot.l * 2.6;

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[w, l]} />
        <meshStandardMaterial map={grass} color="#7e955c" roughness={1} />
      </mesh>
      <PlotFence w={model.plot.w} l={model.plot.l} />
      <Trees plotW={model.plot.w} plotL={model.plot.l} />
    </group>
  );
}

function PlotFence({ w, l }: { w: number; l: number }) {
  const t = 0.08;
  const h = 0.1;
  const mat = <meshStandardMaterial color="#d8c9ae" />;
  return (
    <group position={[0, 0.05, 0]}>
      <mesh position={[0, 0, -l / 2]}>
        <boxGeometry args={[w, h, t]} />
        {mat}
      </mesh>
      <mesh position={[0, 0, l / 2]}>
        <boxGeometry args={[w, h, t]} />
        {mat}
      </mesh>
      <mesh position={[-w / 2, 0, 0]}>
        <boxGeometry args={[t, h, l]} />
        {mat}
      </mesh>
      <mesh position={[w / 2, 0, 0]}>
        <boxGeometry args={[t, h, l]} />
        {mat}
      </mesh>
    </group>
  );
}

function Trees({ plotW, plotL }: { plotW: number; plotL: number }) {
  const spots: [number, number][] = [
    [-plotW * 0.7, -plotL * 0.55],
    [plotW * 0.72, -plotL * 0.48],
    [-plotW * 0.65, plotL * 0.6],
    [plotW * 0.68, plotL * 0.58],
    [plotW * 0.15, -plotL * 0.72],
  ];
  return (
    <group>
      {spots.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 1.1, 0]} castShadow>
            <cylinderGeometry args={[0.18, 0.28, 2.2, 8]} />
            <meshStandardMaterial color="#6b4a32" />
          </mesh>
          <mesh position={[0, 3.3, 0]} castShadow>
            <coneGeometry args={[1.6 + (i % 3) * 0.25, 3.4, 8]} />
            <meshStandardMaterial color={i % 2 ? "#4f7a45" : "#3f6a38"} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
