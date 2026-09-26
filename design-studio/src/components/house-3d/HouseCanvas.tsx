import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, OrbitControls, Sky } from "@react-three/drei";
import { Component, Suspense, useEffect, useMemo, useState, type ReactNode } from "react";
import * as THREE from "three";
import { buildingHeight, floorLevel } from "@/lib/house/layout";
import { planToThree } from "@/lib/house/roof";
import { roofRise } from "@/lib/house/quantities";
import type { HouseModel } from "@/lib/house/types";
import type { CameraPreset } from "@/store/house-store";
import { Furniture } from "./Furniture";
import { HouseMesh } from "./HouseMesh";
import { RoofMesh } from "./RoofMesh";
import { Terrain } from "./Terrain";
import { WalkControls } from "./WalkControls";

class QuietError extends Component<{ children: ReactNode }, { ok: boolean }> {
  state = { ok: true };
  static getDerivedStateFromError() {
    return { ok: false };
  }
  render() {
    return this.state.ok ? this.props.children : null;
  }
}

/**
 * Distance at which a box of `spanH` x `spanV` (feet) fits the viewport, with `depth` feet
 * of the model sitting between the camera and the framing plane. Uses the real aspect
 * ratio so portrait phones frame the house as well as widescreen laptops do.
 */
function fitDistance(spanH: number, spanV: number, depth: number, fovDeg: number, aspect: number) {
  const vHalf = (fovDeg * Math.PI) / 360;
  const hHalf = Math.atan(Math.tan(vHalf) * aspect);
  const byV = spanV / 2 / Math.tan(vHalf);
  const byH = spanH / 2 / Math.tan(hHalf);
  return (Math.max(byV, byH) + depth / 2) * 1.12;
}

function Rig({
  model,
  preset,
  walking,
}: {
  model: HouseModel;
  preset: CameraPreset;
  walking: boolean;
}) {
  const { camera, size } = useThree();
  const aspect = size.width / Math.max(1, size.height);
  const fov = (camera as THREE.PerspectiveCamera).fov;
  const height = buildingHeight(model) + roofRise(model);
  const lookY = height * 0.42;
  const env = model.envelope;

  const goal = useMemo(() => {
    // Front elevation looks along +z from the entrance side (plan "north" = -z), so the
    // span facing the camera is the envelope width for front/back and length for left/right.
    const front = fitDistance(env.w + 4, height + 4, env.l, fov, aspect);
    const side = fitDistance(env.l + 4, height + 4, env.w, fov, aspect);
    const diag = fitDistance(Math.hypot(env.w, env.l) * 1.05, height + 8, Math.hypot(env.w, env.l) * 0.45, fov, aspect) * 1.12;
    const top = fitDistance(env.w + 6, env.l + 6, 0, fov, aspect);
    const t = new THREE.Vector3(0, lookY, 0);
    switch (preset) {
      case "top":
        return { p: new THREE.Vector3(0, top, 0.001), t: new THREE.Vector3(0, 0, 0) };
      case "front":
        return { p: new THREE.Vector3(0, lookY + 2, -front), t };
      case "back":
        return { p: new THREE.Vector3(0, lookY + 2, front), t };
      case "left":
        return { p: new THREE.Vector3(-side, lookY + 2, 0), t };
      case "right":
        return { p: new THREE.Vector3(side, lookY + 2, 0), t };
      default:
        // A three-quarter view from the front-right corner, raised so the roof reads.
        return { p: new THREE.Vector3(diag * 0.62, diag * 0.42 + lookY * 0.4, -diag * 0.7), t };
    }
  }, [preset, env.w, env.l, height, lookY, fov, aspect]);

  const controls = useThree((s) => s.controls) as unknown as {
    target: THREE.Vector3;
    update: () => void;
    maxDistance: number;
  } | null;

  // Snap (not glide) to the orbit view whenever the model or viewport changes, so the
  // house is always framed; presets glide there from wherever the camera currently is.
  useEffect(() => {
    if (walking) return;
    if (preset === "fly") {
      camera.position.copy(goal.p);
      camera.lookAt(goal.t);
      if (controls) {
        controls.target.copy(goal.t);
        controls.maxDistance = Math.max(160, goal.p.length() * 2.5);
        controls.update();
      }
    }
  }, [preset, walking, camera, goal, controls]);

  useFrame((_, dt) => {
    if (walking || preset === "fly") return;
    const d = Math.min(dt, 0.1);
    camera.position.lerp(goal.p, 1 - Math.pow(0.012, d));
    const cur = new THREE.Vector3();
    camera.getWorldDirection(cur);
    const look = camera.position.clone().add(cur);
    look.lerp(goal.t, 1 - Math.pow(0.02, d));
    camera.lookAt(look);
  });

  return null;
}

function CaptureBinder() {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    window.__wadiCapture = (w = 1280) => {
      const prev = gl.getSize(new THREE.Vector2());
      const pr = gl.getPixelRatio();
      gl.setPixelRatio(1);
      gl.setSize(w, Math.round((w * prev.y) / prev.x));
      gl.render(scene, camera);
      const url = gl.domElement.toDataURL("image/jpeg", 0.85);
      gl.setPixelRatio(pr);
      gl.setSize(prev.x, prev.y);
      return url;
    };
    return () => {
      delete window.__wadiCapture;
    };
  }, [gl, scene, camera]);
  return null;
}

function RoomLamp({ model, roomId }: { model: HouseModel; roomId: string }) {
  const room = model.rooms.find((r) => r.id === roomId);
  if (!room) return null;
  const p = planToThree(
    room.x + room.w / 2,
    room.y + room.l / 2,
    floorLevel(model, room.floor) + model.floorH * 0.72,
    model.plot.w,
    model.plot.l,
  );
  return <pointLight position={[p.x, p.y, p.z]} intensity={18} distance={22} color="#fff4e6" />;
}

function Scene({
  model,
  preset,
  walkRoomId,
  layers,
}: {
  model: HouseModel;
  preset: CameraPreset;
  walkRoomId: string | null;
  layers: { roof: boolean; furniture: boolean; landscape: boolean; walls: boolean };
}) {
  const walking = Boolean(walkRoomId);
  return (
    <>
      <Sky sunPosition={[40, 22, 18]} turbidity={6} rayleigh={1.2} mieCoefficient={0.005} />
      <hemisphereLight args={["#f4efe4", "#6a7a4e", 0.85]} />
      <ambientLight intensity={walking ? 0.85 : 0.4} />
      <directionalLight
        position={[28, 36, 16]}
        intensity={1.55}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={120}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={40}
        shadow-camera-bottom={-40}
      />
      {walkRoomId && <RoomLamp model={model} roomId={walkRoomId} />}
      {layers.landscape && <Terrain model={model} />}
      {layers.walls && <HouseMesh model={model} />}
      {layers.roof && !walking && <RoofMesh model={model} />}
      {layers.furniture && (
        <Suspense fallback={null}>
          <QuietError>
            <Furniture model={model} />
          </QuietError>
        </Suspense>
      )}
      <ContactShadows position={[0, 0.02, 0]} opacity={0.28} scale={80} blur={2.4} far={22} />
      <Rig model={model} preset={preset} walking={walking} />
      {walking && walkRoomId ? (
        <WalkControls model={model} roomId={walkRoomId} />
      ) : (
        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.08}
          maxPolarAngle={Math.PI / 2 - 0.04}
          minDistance={8}
          maxDistance={400}
          enabled={preset === "fly"}
        />
      )}
      <CaptureBinder />
    </>
  );
}

export function HouseCanvas({
  model,
  preset,
  walkRoomId,
  layers,
}: {
  model: HouseModel;
  preset: CameraPreset;
  walkRoomId: string | null;
  layers: { roof: boolean; furniture: boolean; landscape: boolean; walls: boolean };
}) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  if (!ready) {
    return (
      <div className="flex h-full items-center justify-center bg-sky text-sm text-muted">
        Loading 3D model…
      </div>
    );
  }
  return (
    <Canvas
      shadows
      dpr={[1, 1.6]}
      camera={{ position: [60, 45, -70], fov: 42, near: 0.12, far: 900 }}
      gl={{ antialias: true, preserveDrawingBuffer: true }}
      className="h-full w-full touch-none"
      style={{ background: "#cfe6f4", touchAction: "none" }}
    >
      <Scene model={model} preset={preset} walkRoomId={walkRoomId} layers={layers} />
    </Canvas>
  );
}
