import { Component, useMemo, type ReactNode } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { HouseModel, Room } from "@/lib/house/types";
import { floorLevel } from "@/lib/house/layout";
import { planToThree } from "@/lib/house/roof";

const SCALE = 2.85;

const FILES = {
  sofa: "/furniture/sofa.glb",
  sofaLong: "/furniture/sofa_long.glb",
  armchair: "/furniture/armchair.glb",
  bed: "/furniture/bed_double.glb",
  bedSingle: "/furniture/bed_single.glb",
  table: "/furniture/coffee_table.glb",
  dining: "/furniture/dining_table.glb",
  chair: "/furniture/chair.glb",
  fridge: "/furniture/fridge.glb",
  sink: "/furniture/kitchen_sink.glb",
  stove: "/furniture/stove.glb",
  cabinet: "/furniture/kitchen_cabinet.glb",
  island: "/furniture/kitchen_island.glb",
  toilet: "/furniture/toilet.glb",
  bath: "/furniture/bathtub.glb",
  shower: "/furniture/shower.glb",
  plant: "/furniture/plant.glb",
  smallPlant: "/furniture/small_plant.glb",
  wardrobe: "/furniture/wardrobe.glb",
  bedside: "/furniture/bedside_table.glb",
  bathSink: "/furniture/bathroom_sink.glb",
  mirror: "/furniture/bathroom_mirror.glb",
  tv: "/furniture/tv.glb",
  tvUnit: "/furniture/tv_unit.glb",
  desk: "/furniture/desk.glb",
  rug: "/furniture/rug.glb",
  bookcase: "/furniture/bookcase.glb",
  ottoman: "/furniture/ottoman.glb",
} as const;

if (typeof window !== "undefined") {
  Object.values(FILES).forEach((url) => useGLTF.preload(url));
}

class QuietError extends Component<{ children: ReactNode }, { ok: boolean }> {
  state = { ok: true };
  static getDerivedStateFromError() {
    return { ok: false };
  }
  render() {
    return this.state.ok ? this.props.children : null;
  }
}

function Item({
  url,
  x,
  y,
  z,
  rot = 0,
  scale = SCALE,
}: {
  url: string;
  x: number;
  y: number;
  z: number;
  rot?: number;
  scale?: number;
}) {
  const gltf = useGLTF(url);
  const scene = useMemo(() => {
    const cloned = gltf.scene.clone(true);
    cloned.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      const mat = mesh.material;
      const apply = (m: THREE.Material) => {
        const std = m as THREE.MeshStandardMaterial;
        if ("metalness" in std) {
          std.metalness = Math.min(std.metalness ?? 0, 0.15);
          std.roughness = Math.max(std.roughness ?? 0.6, 0.45);
        }
      };
      if (Array.isArray(mat)) mat.forEach(apply);
      else if (mat) apply(mat);
    });
    return cloned;
  }, [gltf.scene]);
  return (
    <QuietError>
      <primitive object={scene} position={[x, y, z]} rotation={[0, rot, 0]} scale={scale} />
    </QuietError>
  );
}

function place(room: Room, model: HouseModel, ox: number, oy: number, zOff = 0) {
  return planToThree(
    room.x + ox,
    room.y + oy,
    floorLevel(model, room.floor) + zOff,
    model.plot.w,
    model.plot.l,
  );
}

export function Furniture({ model }: { model: HouseModel }) {
  return (
    <group>
      {model.rooms.map((room) => (
        <RoomSet key={room.id} room={room} model={model} />
      ))}
    </group>
  );
}

function RoomSet({ room, model }: { room: Room; model: HouseModel }) {
  const items: ReactNode[] = [];
  const hasDining = model.rooms.some((r) => r.kind === "dining");
  if (room.kind === "living" || room.kind === "hall") {
    const sofa = place(room, model, room.w * 0.42, room.l * 0.68);
    const table = place(room, model, room.w * 0.42, room.l * 0.44);
    const plant = place(room, model, room.w * 0.84, room.l * 0.8);
    const chair = place(room, model, room.w * 0.74, room.l * 0.36);
    const tv = place(room, model, room.w * 0.42, room.l * 0.14);
    const rug = place(room, model, room.w * 0.42, room.l * 0.5);
    items.push(<Item key="rug" url={FILES.rug} x={rug.x} y={rug.y} z={rug.z} scale={3.4} />);
    items.push(
      <Item key="s" url={room.w > 16 ? FILES.sofaLong : FILES.sofa} x={sofa.x} y={sofa.y} z={sofa.z} rot={Math.PI} />,
    );
    items.push(<Item key="t" url={FILES.table} x={table.x} y={table.y} z={table.z} />);
    items.push(<Item key="a" url={FILES.armchair} x={chair.x} y={chair.y} z={chair.z} rot={-Math.PI / 2} />);
    items.push(<Item key="tvu" url={FILES.tvUnit} x={tv.x} y={tv.y} z={tv.z} />);
    items.push(<Item key="tv" url={FILES.tv} x={tv.x} y={tv.y + 1.15} z={tv.z} scale={2.4} />);
    items.push(<Item key="p" url={FILES.plant} x={plant.x} y={plant.y} z={plant.z} scale={2.2} />);
    if (room.w > 14) {
      const books = place(room, model, room.w * 0.12, room.l * 0.22);
      items.push(<Item key="bk" url={FILES.bookcase} x={books.x} y={books.y} z={books.z} />);
    }
  }
  if (room.kind === "master" || room.kind === "bedroom") {
    const bed = place(room, model, room.w * 0.5, room.l * 0.42);
    const side = place(room, model, room.w * 0.22, room.l * 0.38);
    const ward = place(room, model, room.w * 0.82, room.l * 0.78);
    items.push(
      <Item
        key="bed"
        url={room.kind === "master" || room.w > 12 ? FILES.bed : FILES.bedSingle}
        x={bed.x}
        y={bed.y}
        z={bed.z}
        rot={Math.PI}
      />,
    );
    items.push(<Item key="n" url={FILES.bedside} x={side.x} y={side.y} z={side.z} />);
    items.push(<Item key="w" url={FILES.wardrobe} x={ward.x} y={ward.y} z={ward.z} rot={Math.PI} />);
    if (room.w > 11 && room.l > 11) {
      const desk = place(room, model, room.w * 0.22, room.l * 0.78);
      items.push(<Item key="dk" url={FILES.desk} x={desk.x} y={desk.y} z={desk.z} scale={2.4} />);
    }
  }
  if (room.kind === "dining") {
    const t = place(room, model, room.w * 0.5, room.l * 0.5);
    const cab = place(room, model, room.w * 0.5, room.l * 0.9);
    items.push(<Item key="dtb" url={FILES.dining} x={t.x} y={t.y} z={t.z} scale={Math.min(3.2, Math.max(2.2, room.w / 5))} />);
    if (room.w > 11) items.push(<Item key="dcab" url={FILES.bookcase} x={cab.x} y={cab.y} z={cab.z} rot={Math.PI} />);
  }
  if (room.kind === "study") {
    const d = place(room, model, room.w * 0.5, room.l * 0.22);
    items.push(<Item key="sd" url={FILES.desk} x={d.x} y={d.y} z={d.z} scale={2.4} />);
    if (room.w > 8) {
      const b = place(room, model, room.w * 0.14, room.l * 0.7);
      items.push(<Item key="sb" url={FILES.bookcase} x={b.x} y={b.y} z={b.z} rot={Math.PI / 2} />);
    }
  }
  if (room.kind === "kitchen") {
    const fridge = place(room, model, room.w * 0.16, room.l * 0.18);
    const stove = place(room, model, room.w * 0.42, room.l * 0.18);
    const sink = place(room, model, room.w * 0.7, room.l * 0.18);
    const cab = place(room, model, room.w * 0.88, room.l * 0.18);
    const table = place(room, model, room.w * 0.52, room.l * 0.64);
    items.push(<Item key="fr" url={FILES.fridge} x={fridge.x} y={fridge.y} z={fridge.z} />);
    items.push(<Item key="st" url={FILES.stove} x={stove.x} y={stove.y} z={stove.z} />);
    items.push(<Item key="sk" url={FILES.sink} x={sink.x} y={sink.y} z={sink.z} />);
    items.push(<Item key="cb" url={FILES.cabinet} x={cab.x} y={cab.y} z={cab.z} />);
    if (!hasDining) items.push(<Item key="dt" url={FILES.dining} x={table.x} y={table.y} z={table.z} scale={2.5} />);
    if (room.l > 12) {
      const isl = place(room, model, room.w * 0.4, room.l * 0.42);
      items.push(<Item key="is" url={FILES.island} x={isl.x} y={isl.y} z={isl.z} scale={2.2} />);
    }
  }
  if (room.kind === "bathroom") {
    const toilet = place(room, model, room.w * 0.28, room.l * 0.28);
    const sink = place(room, model, room.w * 0.7, room.l * 0.24);
    const mirror = place(room, model, room.w * 0.7, room.l * 0.18, 3.4);
    items.push(<Item key="to" url={FILES.toilet} x={toilet.x} y={toilet.y} z={toilet.z} />);
    items.push(<Item key="bs" url={FILES.bathSink} x={sink.x} y={sink.y} z={sink.z} />);
    items.push(<Item key="mi" url={FILES.mirror} x={mirror.x} y={mirror.y} z={mirror.z} scale={2.1} />);
    if (room.w >= 7) {
      const bath = place(room, model, room.w * 0.68, room.l * 0.66);
      items.push(<Item key="ba" url={FILES.bath} x={bath.x} y={bath.y} z={bath.z} scale={2.4} />);
    } else {
      const sh = place(room, model, room.w * 0.68, room.l * 0.66);
      items.push(<Item key="sh" url={FILES.shower} x={sh.x} y={sh.y} z={sh.z} scale={2.2} />);
    }
  }
  if (room.kind === "verandah" || room.kind === "balcony") {
    const a = place(room, model, room.w * 0.38, room.l * 0.55);
    const b = place(room, model, room.w * 0.68, room.l * 0.55);
    const ott = place(room, model, room.w * 0.5, room.l * 0.72);
    items.push(<Item key="ch" url={FILES.armchair} x={a.x} y={a.y} z={a.z} />);
    items.push(<Item key="pl" url={FILES.plant} x={b.x} y={b.y} z={b.z} scale={2.0} />);
    items.push(<Item key="ot" url={FILES.ottoman} x={ott.x} y={ott.y} z={ott.z} scale={2.2} />);
  }
  return <group>{items}</group>;
}
