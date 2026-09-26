import { Camera, ChevronDown, Layers } from "lucide-react";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { interiorMove } from "@/components/house-3d/move";
import { ElevationsView } from "@/components/views/elevations";
import { FloorPlanView } from "@/components/views/floor-plan";
import { LayoutView } from "@/components/views/layout-view";
import { QuantitiesView } from "@/components/views/quantities-view";
import { RoofDetailsView } from "@/components/views/roof-details";
import { walkableRooms } from "@/lib/house/layout";
import { cn } from "@/lib/utils";
import { useHouseStore, type CameraPreset } from "@/store/house-store";
import { toast } from "sonner";

const HouseCanvas = lazy(() =>
  import("@/components/house-3d/HouseCanvas").then((m) => ({ default: m.HouseCanvas })),
);

const TABS = [
  { id: "model", label: "3D Model" },
  { id: "plans", label: "Floor Plans" },
  { id: "elevations", label: "Elevations" },
  { id: "roof", label: "Roof Details" },
  { id: "layout", label: "Layout" },
  { id: "quantities", label: "Quantities" },
] as const;

const PRESETS: { id: CameraPreset; label: string }[] = [
  { id: "fly", label: "Orbit" },
  { id: "front", label: "Front" },
  { id: "back", label: "Back" },
  { id: "left", label: "Left" },
  { id: "right", label: "Right" },
  { id: "top", label: "Top" },
];

export function StudioViewport() {
  const model = useHouseStore((s) => s.model);
  const spec = useHouseStore((s) => s.spec);
  const tab = useHouseStore((s) => s.viewTab);
  const setViewTab = useHouseStore((s) => s.setViewTab);
  const planFloor = useHouseStore((s) => s.planFloor);
  const setPlanFloor = useHouseStore((s) => s.setPlanFloor);
  const preset = useHouseStore((s) => s.cameraPreset);
  const setCameraPreset = useHouseStore((s) => s.setCameraPreset);
  const walkRoomId = useHouseStore((s) => s.walkRoomId);
  const enterRoom = useHouseStore((s) => s.enterRoom);
  const layers = useHouseStore((s) => s.layers);
  const toggleLayer = useHouseStore((s) => s.toggleLayer);
  const [layerOpen, setLayerOpen] = useState(false);

  const rooms = useMemo(() => walkableRooms(model), [model]);

  const capture = () => {
    const url = window.__wadiCapture?.(720);
    if (!url) {
      toast.message("Open the 3D tab to capture");
      return;
    }
    const a = document.createElement("a");
    a.href = url;
    a.download = "wadi-shot.jpg";
    a.click();
    toast.success("Shot saved");
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="no-print flex flex-wrap items-center justify-center gap-1 overflow-x-auto border-b border-border px-3 py-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setViewTab(t.id)}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm whitespace-nowrap",
              tab === t.id ? "bg-chip font-medium text-primary" : "text-muted hover:text-fg",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="relative z-10 min-h-0 flex-1 overflow-hidden bg-bg p-3 md:p-4">
        {tab === "model" && (
          <div className="relative h-full min-h-[420px] overflow-hidden rounded-lg bg-sky">
            <Suspense
              fallback={
                <div className="flex h-full items-center justify-center text-sm text-muted">Loading 3D model…</div>
              }
            >
              <HouseCanvas model={model} preset={preset} walkRoomId={walkRoomId} layers={layers} />
            </Suspense>
            {walkRoomId && (
              <WalkHud
                name={rooms.find((r) => r.id === walkRoomId)?.name ?? "Room"}
                onExit={() => enterRoom(null)}
              />
            )}
            {!walkRoomId && (
              <>
                <div className="pointer-events-none absolute inset-x-3 top-3 flex flex-wrap gap-2">
                  <div className="pointer-events-auto flex flex-wrap gap-1 rounded-full bg-overlay/88 p-1 text-primary-fg shadow-lg">
                    {PRESETS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setCameraPreset(p.id)}
                        className={cn(
                          "rounded-full px-3 py-1.5 text-xs sm:text-sm",
                          preset === p.id ? "bg-primary text-primary-fg" : "text-primary-fg/80 hover:text-primary-fg",
                        )}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="pointer-events-none absolute inset-x-3 bottom-3 flex flex-wrap items-end justify-between gap-2">
                  <label className="pointer-events-auto flex min-h-10 items-center rounded-full bg-overlay/88 px-3 text-sm text-primary-fg shadow-lg">
                    <span className="mr-2 hidden text-[10px] tracking-[0.14em] text-faint uppercase sm:inline">Walk</span>
                    <select
                      value=""
                      onChange={(e) => {
                        if (e.target.value) enterRoom(e.target.value);
                      }}
                      className="max-w-[220px] bg-transparent py-2 text-sm text-primary-fg outline-none"
                    >
                      <option value="" className="text-fg">
                        Walk through a room…
                      </option>
                      {rooms.map((r) => (
                        <option key={r.id} value={r.id} className="text-fg">
                          {r.floor === 1 ? "1F · " : ""}
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="pointer-events-auto flex items-center gap-2">
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setLayerOpen((v) => !v)}
                        className="flex min-h-10 items-center gap-2 rounded-full bg-overlay/88 px-3 py-2 text-sm text-primary-fg"
                      >
                        <Layers className="size-3.5" /> Layers <ChevronDown className="size-3.5" />
                      </button>
                      {layerOpen && (
                        <div className="absolute right-0 bottom-12 w-44 rounded-md bg-overlay p-2 text-sm text-primary-fg">
                          {(Object.keys(layers) as Array<keyof typeof layers>).map((k) => (
                            <label key={k} className="flex items-center justify-between px-2 py-1.5 capitalize">
                              {k}
                              <input type="checkbox" checked={layers[k]} onChange={() => toggleLayer(k)} />
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      className="flex min-h-10 items-center rounded-full bg-overlay/88 px-3 py-2 text-sm text-primary-fg"
                      onClick={capture}
                    >
                      <Camera className="mr-1 inline size-3.5" /> Shot
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
        {tab === "plans" && <FloorPlanView model={model} floor={planFloor} onFloor={setPlanFloor} />}
        {tab === "elevations" && <ElevationsView model={model} />}
        {tab === "roof" && <RoofDetailsView model={model} />}
        {tab === "layout" && <LayoutView model={model} floor={planFloor} onFloor={setPlanFloor} />}
        {tab === "quantities" && <QuantitiesView spec={spec} />}
      </div>
    </div>
  );
}

function WalkHud({ name, onExit }: { name: string; onExit: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Escape") onExit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onExit]);
  return (
    <>
      <div className="absolute top-4 left-1/2 z-10 -translate-x-1/2 rounded-full bg-overlay/90 px-4 py-2 text-sm text-primary-fg">
        {name} · WASD move · click to look · Esc exit
      </div>
      <div className="pointer-events-none absolute top-1/2 left-1/2 z-10 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/80" />
      <button
        type="button"
        onClick={onExit}
        className="absolute top-4 right-4 z-10 min-h-10 rounded-full bg-primary px-4 py-2 text-sm text-primary-fg"
      >
        Exit walk-in
      </button>
      <Joystick />
    </>
  );
}

function Joystick() {
  return (
    <div
      className="absolute bottom-28 left-6 z-10 size-28 rounded-full bg-overlay/40 md:hidden"
      onPointerDown={(e) => {
        const el = e.currentTarget;
        const move = (ev: PointerEvent) => {
          const r = el.getBoundingClientRect();
          interiorMove.x = ((ev.clientX - r.left) / r.width) * 2 - 1;
          interiorMove.y = -(((ev.clientY - r.top) / r.height) * 2 - 1);
        };
        const up = () => {
          interiorMove.x = 0;
          interiorMove.y = 0;
          window.removeEventListener("pointermove", move);
          window.removeEventListener("pointerup", up);
        };
        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", up);
      }}
    />
  );
}
