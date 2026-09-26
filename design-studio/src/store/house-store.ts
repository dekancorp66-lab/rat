import { create } from "zustand";
import { buildHouse } from "@/lib/house/layout";
import { decodeSpec, getDesign, saveDesign } from "@/lib/house/persist";
import { DEFAULT_SPEC, specFromTemplate } from "@/lib/house/templates";
import type { HouseModel, HouseSpec, ViewTab } from "@/lib/house/types";

export type CameraPreset = "fly" | "top" | "front" | "back" | "left" | "right";

type HouseState = {
  spec: HouseSpec;
  model: HouseModel;
  savedId: string | null;
  viewTab: ViewTab;
  planFloor: 0 | 1;
  cameraPreset: CameraPreset;
  walkRoomId: string | null;
  layers: { roof: boolean; furniture: boolean; landscape: boolean; walls: boolean };
  history: HouseSpec[];
  future: HouseSpec[];
  hydrateFromSearch: (search: Record<string, unknown>) => void;
  setPartial: (patch: Partial<HouseSpec>) => void;
  loadTemplate: (id: string) => void;
  loadSpec: (spec: HouseSpec, savedId?: string | null) => void;
  setViewTab: (tab: ViewTab) => void;
  setPlanFloor: (f: 0 | 1) => void;
  setCameraPreset: (p: CameraPreset) => void;
  enterRoom: (id: string | null) => void;
  toggleLayer: (k: keyof HouseState["layers"]) => void;
  undo: () => void;
  redo: () => void;
  save: () => string;
};

function withModel(spec: HouseSpec) {
  return { spec, model: buildHouse(spec) };
}

export const useHouseStore = create<HouseState>((set, get) => ({
  ...withModel(DEFAULT_SPEC),
  savedId: null,
  viewTab: "model",
  planFloor: 0,
  cameraPreset: "fly",
  walkRoomId: null,
  layers: { roof: true, furniture: true, landscape: true, walls: true },
  history: [],
  future: [],
  hydrateFromSearch: (search) => {
    const template = typeof search.template === "string" ? search.template : null;
    const specToken = typeof search.spec === "string" ? search.spec : null;
    const saved = typeof search.saved === "string" ? search.saved : null;
    if (specToken) {
      const spec = decodeSpec(specToken);
      if (spec) {
        set({ ...withModel(spec), savedId: null, history: [], future: [], walkRoomId: null });
        return;
      }
    }
    if (saved) {
      const rec = getDesign(saved);
      if (rec) {
        set({ ...withModel(rec.spec), savedId: rec.id, history: [], future: [], walkRoomId: null });
        return;
      }
    }
    if (template) {
      const spec = specFromTemplate(template);
      set({ ...withModel(spec), savedId: null, history: [], future: [], walkRoomId: null });
    }
  },
  setPartial: (patch) => {
    const prev = get().spec;
    const spec = { ...prev, ...patch };
    set({
      ...withModel(spec),
      history: [...get().history.slice(-40), prev],
      future: [],
    });
  },
  loadTemplate: (id) => {
    const spec = specFromTemplate(id);
    set({
      ...withModel(spec),
      savedId: null,
      history: [],
      future: [],
      walkRoomId: null,
      cameraPreset: "fly",
      planFloor: 0,
      viewTab: "model",
    });
  },
  loadSpec: (spec, savedId = null) => {
    set({
      ...withModel(spec),
      savedId,
      history: [],
      future: [],
      walkRoomId: null,
      cameraPreset: "fly",
      viewTab: "model",
    });
  },
  setViewTab: (viewTab) => set({ viewTab, walkRoomId: null }),
  setPlanFloor: (planFloor) => set({ planFloor }),
  setCameraPreset: (cameraPreset) => set({ cameraPreset, walkRoomId: null }),
  enterRoom: (walkRoomId) => set({ walkRoomId, cameraPreset: "fly" }),
  toggleLayer: (k) => set({ layers: { ...get().layers, [k]: !get().layers[k] } }),
  undo: () => {
    const { history, spec, future } = get();
    const prev = history[history.length - 1];
    if (!prev) return;
    set({
      ...withModel(prev),
      history: history.slice(0, -1),
      future: [spec, ...future],
    });
  },
  redo: () => {
    const { future, spec, history } = get();
    const next = future[0];
    if (!next) return;
    set({
      ...withModel(next),
      future: future.slice(1),
      history: [...history, spec],
    });
  },
  save: () => {
    const rec = saveDesign(get().spec, get().savedId ?? undefined);
    set({ savedId: rec.id, spec: { ...get().spec, name: rec.name } });
    return rec.id;
  },
}));
