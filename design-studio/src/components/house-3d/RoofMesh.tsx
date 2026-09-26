import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { roofFaces, type Vec3 } from "@/lib/house/roof";
import { buildingHeight } from "@/lib/house/layout";
import type { HouseModel } from "@/lib/house/types";
import { tileTexture } from "./textures";

/**
 * Roof faces are authored as loose polygons, so their winding order is arbitrary. Three.js
 * culls back faces, which made the roof invisible from outside. Flip any face whose normal
 * points downward so every plane is a proper front face when seen from above.
 */
function upwardWinding(points: Vec3[]): Vec3[] {
  const [a, b, c] = points;
  const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const ac = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  const ny = ab[2] * ac[0] - ab[0] * ac[2];
  return ny < 0 ? [...points].reverse() : points;
}

function faceGeometry(input: Vec3[]) {
  const points = upwardWinding(input);
  const geom = new THREE.BufferGeometry();
  if (points.length === 3) {
    geom.setAttribute("position", new THREE.Float32BufferAttribute(points.flat(), 3));
    geom.setIndex([0, 1, 2]);
  } else {
    const p = points;
    geom.setAttribute(
      "position",
      new THREE.Float32BufferAttribute([...p[0], ...p[1], ...p[2], ...p[0], ...p[2], ...p[3]], 3),
    );
  }
  const pos = geom.getAttribute("position");
  const uvs: number[] = [];
  for (let i = 0; i < pos.count; i++) {
    uvs.push(pos.getX(i) * 0.38, pos.getZ(i) * 0.38);
  }
  geom.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geom.computeVertexNormals();
  return geom;
}

function RoofFaceMesh({
  points,
  color,
  map,
}: {
  points: Vec3[];
  color: string;
  map?: THREE.Texture;
}) {
  const geom = useMemo(() => faceGeometry(points), [points]);
  useEffect(() => () => geom.dispose(), [geom]);
  return (
    <mesh geometry={geom} castShadow receiveShadow>
      <meshStandardMaterial
        color={color}
        map={map}
        roughness={0.72}
        metalness={map ? 0 : 0.05}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

export function RoofMesh({ model }: { model: HouseModel }) {
  const faces = useMemo(() => roofFaces(model), [model]);
  const tiles = useMemo(() => tileTexture(), []);
  const y = buildingHeight(model);
  // The tile texture already carries the terracotta colour; tinting it again made it near-black.
  const color = model.spec.roofStyle === "flat" ? "#cfc6b8" : "#ffffff";

  return (
    <group position={[0, y, 0]}>
      {faces.map((f) => (
        <RoofFaceMesh
          key={f.id}
          points={f.points}
          color={color}
          map={model.spec.roofStyle === "flat" ? undefined : tiles}
        />
      ))}
      {model.spec.roofStyle !== "flat" && model.spec.roofStyle !== "shed" && <RidgeCap model={model} />}
      {model.spec.roofStyle === "flat" && <Parapet model={model} />}
    </group>
  );
}

function RidgeCap({ model }: { model: HouseModel }) {
  const w = model.envelope.w + 3.2;
  const d = model.envelope.l + 3.2;
  const rise = Math.max(...roofFaces(model).flatMap((f) => f.points.map((p) => p[1])));
  const alongX = w >= d;
  return (
    <mesh position={[0, rise + 0.08, 0]} rotation={alongX ? [0, 0, 0] : [0, Math.PI / 2, 0]} castShadow>
      <boxGeometry args={[alongX ? Math.max(2, w - d) + 1.4 : Math.max(2, d - w) + 1.4, 0.16, 0.32]} />
      <meshStandardMaterial color="#9a3a24" roughness={0.6} />
    </mesh>
  );
}

function Parapet({ model }: { model: HouseModel }) {
  const w = model.envelope.w + 2.4;
  const d = model.envelope.l + 2.4;
  const t = 0.35;
  const h = 1.15;
  return (
    <group position={[0, 0.4, 0]}>
      <mesh position={[0, h / 2, -d / 2]}>
        <boxGeometry args={[w, h, t]} />
        <meshStandardMaterial color="#ddd4c6" roughness={0.85} />
      </mesh>
      <mesh position={[0, h / 2, d / 2]}>
        <boxGeometry args={[w, h, t]} />
        <meshStandardMaterial color="#ddd4c6" roughness={0.85} />
      </mesh>
      <mesh position={[-w / 2, h / 2, 0]}>
        <boxGeometry args={[t, h, d]} />
        <meshStandardMaterial color="#ddd4c6" roughness={0.85} />
      </mesh>
      <mesh position={[w / 2, h / 2, 0]}>
        <boxGeometry args={[t, h, d]} />
        <meshStandardMaterial color="#ddd4c6" roughness={0.85} />
      </mesh>
    </group>
  );
}
