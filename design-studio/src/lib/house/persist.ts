import type { HouseSpec } from "./types";

const KEY = "wadi-designs-v1";

export type SavedDesign = {
  id: string;
  name: string;
  spec: HouseSpec;
  savedAt: number;
};

function readAll(): SavedDesign[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedDesign[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(items: SavedDesign[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

export function listDesigns(): SavedDesign[] {
  return readAll().sort((a, b) => b.savedAt - a.savedAt);
}

export function saveDesign(spec: HouseSpec, id?: string): SavedDesign {
  const items = readAll();
  const rec: SavedDesign = {
    id: id ?? (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `d-${Date.now()}`),
    name: spec.name || "Untitled home",
    spec,
    savedAt: Date.now(),
  };
  const idx = items.findIndex((d) => d.id === rec.id);
  if (idx >= 0) items[idx] = rec;
  else items.unshift(rec);
  writeAll(items);
  return rec;
}

export function deleteDesign(id: string) {
  writeAll(readAll().filter((d) => d.id !== id));
}

export function getDesign(id: string) {
  return readAll().find((d) => d.id === id) ?? null;
}

export function encodeSpec(spec: HouseSpec) {
  return encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(spec)))));
}

export function decodeSpec(token: string): HouseSpec | null {
  try {
    const json = decodeURIComponent(escape(atob(decodeURIComponent(token))));
    const spec = JSON.parse(json) as HouseSpec;
    if (!spec || typeof spec.plotWidth !== "number") return null;
    return spec;
  } catch {
    return null;
  }
}
