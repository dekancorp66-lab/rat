import { buildHouse, roomArea } from "./layout";
import type { HouseModel, HouseSpec } from "./types";

export type LineItem = {
  id: string;
  label: string;
  detail: string;
  qty: number;
  unit: string;
  unitCost: number;
  total: number;
  group: "roof" | "structure" | "openings" | "finishes";
};

export type Estimate = {
  floorArea: number;
  roofArea: number;
  footprint: number;
  wallAreaExt: number;
  wallAreaInt: number;
  items: LineItem[];
  materialCost: number;
};

export function roofPitchDeg(style: HouseSpec["roofStyle"]) {
  if (style === "flat") return 2;
  if (style === "shed") return 18;
  if (style === "gable") return 32;
  return 28;
}

export function roofRise(model: HouseModel) {
  const span = Math.min(model.envelope.w, model.envelope.l);
  const pitch = (roofPitchDeg(model.spec.roofStyle) * Math.PI) / 180;
  if (model.spec.roofStyle === "flat") return 0.8;
  if (model.spec.roofStyle === "shed") return Math.tan(pitch) * span;
  return Math.tan(pitch) * (span / 2);
}

export function computeRoofArea(model: HouseModel) {
  const over = 1.6;
  const w = model.envelope.w + over * 2;
  const l = model.envelope.l + over * 2;
  const rise = roofRise(model);
  const style = model.spec.roofStyle;
  if (style === "flat") return w * l;
  if (style === "shed") {
    const slope = Math.hypot(l, rise);
    return w * slope;
  }
  if (style === "gable") {
    const half = l / 2;
    const slope = Math.hypot(half, rise);
    return 2 * w * slope;
  }
  const halfW = w / 2;
  const halfL = l / 2;
  const slopeW = Math.hypot(halfL, rise);
  const slopeL = Math.hypot(halfW, rise);
  return 2 * w * slopeW * 0.5 + 2 * l * slopeL * 0.5 + w * l * 0.08;
}

function money(n: number) {
  return Math.round(n);
}

export function estimateHouse(spec: HouseSpec): Estimate {
  const model = buildHouse(spec);
  const footprint = model.envelope.w * model.envelope.l;
  const floorArea = model.rooms
    .filter((r) => r.kind !== "verandah" && r.kind !== "balcony" && r.kind !== "stair")
    .reduce((s, r) => s + roomArea(r), 0);
  const roofArea = computeRoofArea(model);
  const wallH = model.floorH * model.stories;
  const peri = 2 * (model.envelope.w + model.envelope.l);
  const wallAreaExt = peri * wallH;
  const wallAreaInt = model.walls.filter((w) => w.interior).reduce((s, w) => {
    const len = Math.hypot(w.x2 - w.x1, w.y2 - w.y1);
    return s + len * model.floorH;
  }, 0);

  const tiles = Math.round(roofArea / 0.79);
  const flashing = Math.round(peri + 24);
  const trusses = Math.max(8, Math.round((Math.max(model.envelope.w, model.envelope.l) / 2) * 1.4));
  const feltRolls = Math.max(2, Math.ceil(roofArea / 306));
  const gutters = Math.round(peri);
  const doors = model.openings.filter((o) => o.type === "door").length;
  const windows = model.openings.filter((o) => o.type === "window").length;
  const slab = footprint * model.stories * model.slabT * 0.0283;
  const paintExt = wallAreaExt;
  const paintInt = wallAreaInt * 2;
  const flooring = floorArea;

  const items: LineItem[] = [
    line("tiles", "Terracotta Tiles", `${tiles.toLocaleString()} units`, tiles, "units", 1.5, "roof"),
    line("flash", "Metal Sheet Flashing", `${flashing} linear ft`, flashing, "lin ft", 8, "roof"),
    line("truss", "Timber Trusses (Pine)", `${trusses} trusses`, trusses, "trusses", 120, "roof"),
    line("felt", "Underlayment Felt", `${feltRolls} rolls`, feltRolls, "rolls", 80, "roof"),
    line("gutter", "Guttering Systems", `${gutters} linear ft`, gutters, "lin ft", 6.4, "roof"),
    line("slab", "RCC floor slabs", `${slab.toFixed(1)} m³`, money(slab * 180), "m³", 1, "structure"),
    line("plinth", "Plinth & foundation", `${Math.round(footprint)} sq ft`, money(footprint * 4.2), "sq ft", 1, "structure"),
    line("doors", "Doors (hardwood)", `${doors} leaves`, doors, "ea", 280, "openings"),
    line("windows", "Windows (aluminium)", `${windows} units`, windows, "ea", 180, "openings"),
    line("floor", "Floor finish", `${Math.round(flooring)} sq ft`, money(flooring), "sq ft", 4.2, "finishes"),
    line("paint-ext", "Exterior paint", `${Math.round(paintExt)} sq ft`, money(paintExt), "sq ft", 0.85, "finishes"),
    line("paint-int", "Interior paint", `${Math.round(paintInt)} sq ft`, money(paintInt), "sq ft", 0.55, "finishes"),
  ];

  const materialCost = items.reduce((s, i) => s + i.total, 0);
  return {
    floorArea: round(floorArea),
    roofArea: round(roofArea),
    footprint: round(footprint),
    wallAreaExt: round(wallAreaExt),
    wallAreaInt: round(wallAreaInt),
    items,
    materialCost,
  };
}

function round(n: number) {
  return Math.round(n * 10) / 10;
}

function line(
  id: string,
  label: string,
  detail: string,
  qty: number,
  unit: string,
  unitCost: number,
  group: LineItem["group"],
): LineItem {
  const total = money(qty * unitCost);
  return { id, label, detail, qty, unit, unitCost, total, group };
}

// Display currency for the bill of quantities. Underlying cost data in this
// file is modeled in USD; we convert at a fixed approximate market rate for
// display. USD/TZS moves day to day (it's floated roughly 2,400–2,650 over
// the last year) — update TZS_PER_USD if you want to track the live rate,
// or wire this up to a rates API instead of a constant.
const TZS_PER_USD = 2600;

export function formatMoney(n: number) {
  const tzs = Math.round(n * TZS_PER_USD);
  return `TSh ${tzs.toLocaleString("en-US")}`;
}

export function buildHouseMemo(spec: HouseSpec): HouseModel {
  return buildHouse(spec);
}