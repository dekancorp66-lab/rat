import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { buildingHeight, floorLevel } from "@/lib/house/layout";
import { gableEnds, planToThree } from "@/lib/house/roof";
import type { HouseModel, Opening, Room, WallSeg } from "@/lib/house/types";
import { stuccoTexture, woodTexture } from "./textures";

const WALL = "#efe6d6";
const WALL_IN = "#f4eee4";
const PLINTH = "#a48468";
const SLAB = "#c8c2b8";
const FRAME = "#2c241c";
const GLASS = "#9ec9e6";
const DOOR = "#6b3e2e";

function wallBoxes(wall: WallSeg, model: HouseModel) {
  const len = Math.hypot(wall.x2 - wall.x1, wall.y2 - wall.y1);
  const alongX = Math.abs(wall.x2 - wall.x1) >= Math.abs(wall.y2 - wall.y1);
  const t = model.wallT;
  const h = model.floorH;
  const openings = [...wall.openings].sort((a, b) => a.offset - b.offset);
  type Box = { cx: number; cy: number; cz: number; sx: number; sy: number; sz: number };
  const boxes: Box[] = [];
  const y0 = floorLevel(model, wall.floor);

  const toWorld = (along: number, midH: number) => {
    const u = len === 0 ? 0 : along / len;
    const x = wall.x1 + (wall.x2 - wall.x1) * u;
    const y = wall.y1 + (wall.y2 - wall.y1) * u;
    return planToThree(x, y, y0 + midH, model.plot.w, model.plot.l);
  };

  const push = (from: number, to: number, z0: number, z1: number) => {
    if (to - from < 0.08 || z1 - z0 < 0.08) return;
    const mid = (from + to) / 2;
    const midH = (z0 + z1) / 2;
    const p = toWorld(mid, midH);
    boxes.push({
      cx: p.x,
      cy: p.y,
      cz: p.z,
      sx: alongX ? to - from : t,
      sy: z1 - z0,
      sz: alongX ? t : to - from,
    });
  };

  let cursor = 0;
  for (const o of openings) {
    const a = Math.max(0, o.offset);
    const b = Math.min(len, o.offset + o.width);
    push(cursor, a, 0, h);
    if (o.sill > 0) push(a, b, 0, o.sill);
    push(a, b, o.sill + o.height, h);
    cursor = b;
  }
  push(cursor, len, 0, h);
  return { boxes, openings, alongX, y0, len };
}

export function HouseMesh({ model }: { model: HouseModel }) {
  const stucco = useMemo(() => stuccoTexture(), []);
  const wood = useMemo(() => woodTexture(), []);
  const env = model.envelope;
  const cx = planToThree(env.x + env.w / 2, env.y + env.l / 2, 0, model.plot.w, model.plot.l);

  return (
    <group>
      <mesh position={[cx.x, model.plinthH / 2, cx.z]} receiveShadow castShadow>
        <boxGeometry args={[env.w + 1.2, model.plinthH, env.l + 1.2]} />
        <meshStandardMaterial color={PLINTH} roughness={0.9} />
      </mesh>

      {Array.from({ length: model.stories }).map((_, fi) => {
        const floor = fi as 0 | 1;
        const z = floorLevel(model, floor) - model.slabT / 2;
        return (
          <mesh key={`slab-${floor}`} position={[cx.x, z, cx.z]} receiveShadow>
            <boxGeometry args={[env.w, model.slabT, env.l]} />
            <meshStandardMaterial color={SLAB} map={wood} roughness={0.85} />
          </mesh>
        );
      })}

      {model.rooms
        .filter((r) => r.kind !== "verandah" && r.kind !== "balcony" && r.kind !== "stair")
        .map((r) => {
          const p = planToThree(
            r.x + r.w / 2,
            r.y + r.l / 2,
            floorLevel(model, r.floor) + 0.02,
            model.plot.w,
            model.plot.l,
          );
          return (
            <mesh key={`fl-${r.id}`} position={[p.x, p.y, p.z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
              <planeGeometry args={[Math.max(0.4, r.w - 0.2), Math.max(0.4, r.l - 0.2)]} />
              <meshStandardMaterial
                color={r.kind === "bathroom" ? "#d9ddd8" : r.kind === "kitchen" ? "#d7cfc4" : "#cbb79a"}
                roughness={0.8}
              />
            </mesh>
          );
        })}

      {model.rooms
        .filter((r) => r.kind !== "verandah" && r.kind !== "balcony")
        .map((r) => {
          const p = planToThree(
            r.x + r.w / 2,
            r.y + r.l / 2,
            floorLevel(model, r.floor) + model.floorH - 0.04,
            model.plot.w,
            model.plot.l,
          );
          return (
            <mesh key={`cl-${r.id}`} position={[p.x, p.y, p.z]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[Math.max(0.4, r.w - 0.15), Math.max(0.4, r.l - 0.15)]} />
              <meshStandardMaterial color="#f3ece0" roughness={0.92} side={THREE.DoubleSide} />
            </mesh>
          );
        })}

      {model.walls.map((wall) => (
        <WallView key={wall.id} wall={wall} model={model} stucco={stucco} />
      ))}

      {model.rooms
        .filter((r) => r.kind === "verandah" || r.kind === "balcony")
        .map((r) => (
          <Porch key={r.id} room={r} model={model} />
        ))}

      {model.rooms
        .filter((r) => r.kind === "stair")
        .map((r) => (
          <StairMesh key={r.id} room={r} model={model} />
        ))}

      <GableInfill model={model} />
    </group>
  );
}

function WallView({
  wall,
  model,
  stucco,
}: {
  wall: WallSeg;
  model: HouseModel;
  stucco: THREE.Texture;
}) {
  const built = useMemo(() => wallBoxes(wall, model), [wall, model]);
  return (
    <group>
      {built.boxes.map((b, i) => (
        <mesh key={i} position={[b.cx, b.cy, b.cz]} castShadow receiveShadow>
          <boxGeometry args={[b.sx, b.sy, b.sz]} />
          <meshStandardMaterial
            color={wall.interior ? WALL_IN : WALL}
            map={wall.interior ? undefined : stucco}
            roughness={0.88}
          />
        </mesh>
      ))}
      {built.openings.map((o) => (
        <OpeningView key={o.id} wall={wall} opening={o} model={model} alongX={built.alongX} />
      ))}
    </group>
  );
}

function OpeningView({
  wall,
  opening,
  model,
  alongX,
}: {
  wall: WallSeg;
  opening: Opening;
  model: HouseModel;
  alongX: boolean;
}) {
  const len = Math.hypot(wall.x2 - wall.x1, wall.y2 - wall.y1);
  const u = len === 0 ? 0 : (opening.offset + opening.width / 2) / len;
  const x = wall.x1 + (wall.x2 - wall.x1) * u;
  const y = wall.y1 + (wall.y2 - wall.y1) * u;
  const y0 = floorLevel(model, wall.floor);
  const midH = opening.sill + opening.height / 2;
  const p = planToThree(x, y, y0 + midH, model.plot.w, model.plot.l);
  const frameT = 0.14;
  const isDoor = opening.type === "door";
  const exterior = opening.connectsTo === "exterior";
  // Wide interior openings (verandah/living, lounge/balcony, living/dining) are open archways: no leaf.
  const arch = isDoor && !exterior && opening.width >= 5;
  const depth = model.wallT + 0.06;
  const w = opening.width;
  const h = opening.height;

  // Frame = four thin bars, so the opening stays open (a solid slab here rendered every
  // window and doorway as a black rectangle). Sizes are [along-wall, height, across-wall].
  const along = (len: number, hgt: number): [number, number, number] =>
    alongX ? [len, hgt, depth] : [depth, hgt, len];
  const at = (a: number, y: number): [number, number, number] => (alongX ? [a, y, 0] : [0, y, a]);
  const bars: { pos: [number, number, number]; size: [number, number, number] }[] = [
    { pos: at(0, h / 2 - frameT / 2), size: along(w, frameT) },
    { pos: at(-w / 2 + frameT / 2, 0), size: along(frameT, h) },
    { pos: at(w / 2 - frameT / 2, 0), size: along(frameT, h) },
  ];
  if (!isDoor) bars.push({ pos: at(0, -h / 2 + frameT / 2), size: along(w, frameT) });

  return (
    <group position={[p.x, p.y, p.z]}>
      {bars.map((b, i) => (
        <mesh key={i} position={b.pos} castShadow>
          <boxGeometry args={b.size} />
          <meshStandardMaterial color={FRAME} roughness={0.7} />
        </mesh>
      ))}
      {arch ? null : isDoor ? (
        <mesh
          // Entrance doors are shut; interior doors stand ajar so rooms read as connected.
          position={
            exterior
              ? [0, 0, 0]
              : alongX
                ? [w * 0.18, 0, model.wallT * 0.35]
                : [model.wallT * 0.35, 0, w * 0.18]
          }
          rotation={exterior ? [0, 0, 0] : alongX ? [0, -0.55, 0] : [0, Math.PI / 2 - 0.55, 0]}
          castShadow
        >
          <boxGeometry
            args={
              exterior
                ? alongX
                  ? [w - frameT * 2, h - frameT, 0.1]
                  : [0.1, h - frameT, w - frameT * 2]
                : [w * 0.92, h * 0.94, 0.08]
            }
          />
          <meshStandardMaterial color={DOOR} roughness={0.65} />
        </mesh>
      ) : (
        <mesh>
          <boxGeometry
            args={alongX ? [w - frameT * 2, h - frameT * 2, 0.05] : [0.05, h - frameT * 2, w - frameT * 2]}
          />
          <meshStandardMaterial
            color={GLASS}
            transparent
            opacity={0.45}
            roughness={0.1}
            metalness={0.2}
            emissive="#3d6d8c"
            emissiveIntensity={0.18}
          />
        </mesh>
      )}
    </group>
  );
}

function Porch({
  room,
  model,
}: {
  room: Room;
  model: HouseModel;
}) {
  const y0 = floorLevel(model, room.floor);
  const h = model.floorH;
  const pts = [
    [room.x + 0.55, room.y + 0.55],
    [room.x + room.w - 0.55, room.y + 0.55],
    [room.x + 0.55, room.y + room.l - 0.55],
    [room.x + room.w - 0.55, room.y + room.l - 0.55],
  ];
  const railH = 2.8;
  const open = room.openSides ?? ["n"];
  const mid = planToThree(room.x + room.w / 2, room.y + room.l / 2, y0 + 0.03, model.plot.w, model.plot.l);
  return (
    <group>
      <mesh position={[mid.x, mid.y, mid.z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[Math.max(0.4, room.w - 0.15), Math.max(0.4, room.l - 0.15)]} />
        <meshStandardMaterial color="#d8c4a4" roughness={0.86} />
      </mesh>
      {pts.map(([x, y], i) => {
        const p = planToThree(x, y, y0 + h / 2, model.plot.w, model.plot.l);
        return (
          <mesh key={i} position={[p.x, p.y, p.z]} castShadow>
            <cylinderGeometry args={[0.26, 0.3, h, 12]} />
            <meshStandardMaterial color="#f3ece0" roughness={0.8} />
          </mesh>
        );
      })}
      {open.includes("n") && <Rail room={room} model={model} side="n" y0={y0} railH={railH} />}
      {open.includes("s") && <Rail room={room} model={model} side="s" y0={y0} railH={railH} />}
      {open.includes("e") && <Rail room={room} model={model} side="e" y0={y0} railH={railH} />}
      {open.includes("w") && <Rail room={room} model={model} side="w" y0={y0} railH={railH} />}
    </group>
  );
}

function Rail({
  room,
  model,
  side,
  y0,
  railH,
}: {
  room: Room;
  model: HouseModel;
  side: "n" | "s" | "e" | "w";
  y0: number;
  railH: number;
}) {
  const alongFront = side === "n" || side === "s" ? room.w : room.l;
  const x = side === "e" ? room.x + room.w - 0.2 : side === "w" ? room.x + 0.2 : room.x + room.w / 2;
  const y = side === "s" ? room.y + room.l - 0.2 : side === "n" ? room.y + 0.2 : room.y + room.l / 2;
  const p = planToThree(x, y, y0 + railH / 2, model.plot.w, model.plot.l);
  const args: [number, number, number] =
    side === "n" || side === "s" ? [alongFront - 0.8, 0.12, 0.12] : [0.12, 0.12, alongFront - 0.8];
  return (
    <mesh position={[p.x, p.y, p.z]}>
      <boxGeometry args={args} />
      <meshStandardMaterial color="#ddd4c6" />
    </mesh>
  );
}

function StairMesh({ room, model }: { room: Room; model: HouseModel }) {
  if (room.floor !== 0) return null;
  const steps = 11;
  const total = model.floorH + model.slabT;
  const rise = total / steps;
  const alongL = room.l >= room.w;
  const run = (alongL ? room.l : room.w) / steps;
  return (
    <group>
      {Array.from({ length: steps }).map((_, i) => {
        const along = (i + 0.5) * run;
        const x = alongL ? room.x + room.w / 2 : room.x + along;
        const y = alongL ? room.y + along : room.y + room.l / 2;
        const z = floorLevel(model, 0) + (i + 0.5) * rise;
        const p = planToThree(x, y, z, model.plot.w, model.plot.l);
        return (
          <mesh key={i} position={[p.x, p.y, p.z]} castShadow receiveShadow>
            <boxGeometry
              args={alongL ? [room.w * 0.86, rise * 0.92, run * 0.92] : [run * 0.92, rise * 0.92, room.l * 0.86]}
            />
            <meshStandardMaterial color="#c4b49a" roughness={0.8} />
          </mesh>
        );
      })}
    </group>
  );
}

function GableInfill({ model }: { model: HouseModel }) {
  const ends = useMemo(() => gableEnds(model), [model]);
  const y = buildingHeight(model);
  if (ends.length === 0) return null;
  return (
    <group position={[0, y, 0]}>
      {ends.map((e) => (
        <GableFace key={e.id} points={e.points} />
      ))}
    </group>
  );
}

function GableFace({ points }: { points: [number, number, number][] }) {
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(points.flat(), 3));
    g.setIndex([0, 1, 2]);
    g.computeVertexNormals();
    return g;
  }, [points]);
  useEffect(() => () => geom.dispose(), [geom]);
  return (
    <mesh geometry={geom} castShadow>
      <meshStandardMaterial color={WALL} roughness={0.88} side={THREE.DoubleSide} />
    </mesh>
  );
}
