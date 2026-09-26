import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { floorLevel } from "@/lib/house/layout";
import { planToThree, threeToPlan } from "@/lib/house/roof";
import type { HouseModel, Opening } from "@/lib/house/types";
import { interiorMove } from "./move";

const SPEED = 9;
const SENS = 0.0022;

type Probe = {
  getYaw: () => number;
  getSpeed: () => number;
  setKeys: (codes: string[]) => void;
};

declare global {
  interface Window {
    __controlsTest?: Probe;
    __wadiWalk?: { yaw: number; room: string | null };
    __wadiCapture?: (w?: number) => string;
  }
}

function doorCenter(o: Opening) {
  return { cx: (o.p1[0] + o.p2[0]) / 2, cy: (o.p1[1] + o.p2[1]) / 2 };
}

function walkable(px: number, py: number, model: HouseModel, floor: 0 | 1) {
  const rooms = model.rooms.filter((r) => r.floor === floor);
  const inset = 0.42;
  for (const r of rooms) {
    if (px > r.x + inset && px < r.x + r.w - inset && py > r.y + inset && py < r.y + r.l - inset) {
      return true;
    }
  }
  for (const o of model.openings) {
    if (o.type !== "door") continue;
    if (!rooms.some((r) => r.id === o.roomId)) continue;
    const { cx, cy } = doorCenter(o);
    if (Math.hypot(px - cx, py - cy) < 1.8) return true;
  }
  return false;
}

export function WalkControls({ model, roomId }: { model: HouseModel; roomId: string }) {
  const { camera, gl } = useThree();
  const yaw = useRef(0);
  const pitch = useRef(0);
  const keys = useRef(new Set<string>());
  const pos = useRef({ x: 0, y: 0, z: 0 });
  const speed = useRef(0);
  const injected = useRef<string[] | null>(null);

  const room = model.rooms.find((r) => r.id === roomId);

  useEffect(() => {
    if (!room) return;
    const eye = floorLevel(model, room.floor) + 4.55;
    const p = planToThree(room.x + room.w / 2, room.y + room.l / 2, eye, model.plot.w, model.plot.l);
    pos.current = { x: p.x, y: p.y, z: p.z };
    yaw.current = room.l >= room.w ? 0 : Math.PI / 2;
    pitch.current = -0.08;
    camera.position.set(p.x, p.y, p.z);
    camera.rotation.set(0, 0, 0, "YXZ");
  }, [roomId, room, model, camera]);

  useEffect(() => {
    const el = gl.domElement;
    const down = (e: KeyboardEvent) => {
      keys.current.add(e.code);
      if (["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) {
        e.preventDefault();
      }
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.code);
    const blur = () => keys.current.clear();
    const moveLook = (e: MouseEvent) => {
      if (document.pointerLockElement !== el) return;
      yaw.current -= e.movementX * SENS;
      pitch.current = Math.max(-1.2, Math.min(1.2, pitch.current - e.movementY * SENS));
    };
    const click = () => {
      if (document.pointerLockElement !== el) void el.requestPointerLock();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    el.addEventListener("mousemove", moveLook);
    el.addEventListener("click", click);
    window.__controlsTest = {
      getYaw: () => yaw.current,
      getSpeed: () => speed.current,
      setKeys: (codes) => {
        injected.current = codes;
      },
    };
    window.__wadiWalk = { yaw: 0, room: roomId };
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
      el.removeEventListener("mousemove", moveLook);
      el.removeEventListener("click", click);
      if (document.pointerLockElement === el) document.exitPointerLock();
      delete window.__controlsTest;
    };
  }, [gl, roomId]);

  useFrame((_, dt) => {
    const d = Math.min(dt, 0.1);
    const held = injected.current ? new Set(injected.current) : keys.current;
    const fx = -Math.sin(yaw.current);
    const fz = -Math.cos(yaw.current);
    const rx = Math.cos(yaw.current);
    const rz = -Math.sin(yaw.current);
    let mx = 0;
    let mz = 0;
    if (held.has("KeyW") || held.has("ArrowUp")) {
      mx += fx;
      mz += fz;
    }
    if (held.has("KeyS") || held.has("ArrowDown")) {
      mx -= fx;
      mz -= fz;
    }
    if (held.has("KeyD") || held.has("ArrowRight")) {
      mx += rx;
      mz += rz;
    }
    if (held.has("KeyA") || held.has("ArrowLeft")) {
      mx -= rx;
      mz -= rz;
    }
    mx += rx * interiorMove.x + fx * interiorMove.y;
    mz += rz * interiorMove.x + fz * interiorMove.y;
    const mag = Math.hypot(mx, mz);
    if (mag > 1) {
      mx /= mag;
      mz /= mag;
    }
    speed.current = mag * SPEED;
    const nx = pos.current.x + mx * SPEED * d;
    const nz = pos.current.z + mz * SPEED * d;
    const fl = room?.floor ?? 0;
    const plan = threeToPlan(nx, nz, model.plot.w, model.plot.l);
    const planX = threeToPlan(pos.current.x, pos.current.z, model.plot.w, model.plot.l);
    if (walkable(plan.x, plan.y, model, fl)) {
      pos.current.x = nx;
      pos.current.z = nz;
    } else if (walkable(plan.x, planX.y, model, fl)) {
      pos.current.x = nx;
    } else if (walkable(planX.x, plan.y, model, fl)) {
      pos.current.z = nz;
    }
    camera.position.set(pos.current.x, pos.current.y, pos.current.z);
    camera.rotation.set(pitch.current, yaw.current, 0, "YXZ");
    if (window.__wadiWalk) window.__wadiWalk.yaw = yaw.current;
  });

  return null;
}
