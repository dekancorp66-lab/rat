import { roofRise } from "./quantities";
import type { HouseModel } from "./types";

export type Vec3 = [number, number, number];
export type RoofFace = {
  id: string;
  name: string;
  points: Vec3[];
  area: number;
};

export function roofFaces(model: HouseModel): RoofFace[] {
  const over = 1.8;
  const w = model.envelope.w + over * 2;
  const d = model.envelope.l + over * 2;
  const rise = roofRise(model);
  const style = model.spec.roofStyle;
  const y0 = 0;
  const y1 = rise;
  const hw = w / 2;
  const hd = d / 2;
  const nw: Vec3 = [-hw, y0, -hd];
  const ne: Vec3 = [hw, y0, -hd];
  const se: Vec3 = [hw, y0, hd];
  const sw: Vec3 = [-hw, y0, hd];

  if (style === "flat") {
    const p: Vec3[] = [
      [-hw, 0.12, -hd],
      [hw, 0.28, -hd],
      [hw, 0.12, hd],
      [-hw, 0, hd],
    ];
    return [{ id: "deck", name: "Roof deck", points: p, area: w * d }];
  }
  if (style === "shed") {
    const highN: Vec3[] = [
      [-hw, y1, -hd],
      [hw, y1, -hd],
      [hw, y0, hd],
      [-hw, y0, hd],
    ];
    return [{ id: "shed", name: "Shed slope", points: highN, area: w * Math.hypot(d, rise) }];
  }
  if (style === "gable") {
    const r1: Vec3 = [-hw, y1, 0];
    const r2: Vec3 = [hw, y1, 0];
    const north: Vec3[] = [nw, ne, r2, r1];
    const south: Vec3[] = [sw, r1, r2, se];
    const slope = Math.hypot(hd, rise);
    return [
      { id: "north", name: "North slope", points: north, area: w * slope },
      { id: "south", name: "South slope", points: south, area: w * slope },
    ];
  }
  if (w >= d) {
    const inset = hd;
    const r1: Vec3 = [-hw + inset, y1, 0];
    const r2: Vec3 = [hw - inset, y1, 0];
    const north: Vec3[] = [nw, ne, r2, r1];
    const south: Vec3[] = [se, sw, r1, r2];
    const west: Vec3[] = [nw, r1, sw];
    const east: Vec3[] = [ne, se, r2];
    return [
      { id: "north", name: "North slope", points: north, area: triArea(nw, ne, r2) + triArea(nw, r2, r1) },
      { id: "south", name: "South slope", points: south, area: triArea(se, sw, r1) + triArea(se, r1, r2) },
      { id: "west", name: "West hip", points: west, area: triArea(nw, r1, sw) },
      { id: "east", name: "East hip", points: east, area: triArea(ne, se, r2) },
    ];
  }
  const inset = hw;
  const r1: Vec3 = [0, y1, -hd + inset];
  const r2: Vec3 = [0, y1, hd - inset];
  return [
    { id: "west", name: "West slope", points: [nw, r1, r2, sw], area: d * Math.hypot(hw, rise) },
    { id: "east", name: "East slope", points: [ne, se, r2, r1], area: d * Math.hypot(hw, rise) },
    { id: "north", name: "North hip", points: [nw, ne, r1], area: triArea(nw, ne, r1) },
    { id: "south", name: "South hip", points: [sw, r2, se], area: triArea(sw, r2, se) },
  ];
}

function triArea(a: Vec3, b: Vec3, c: Vec3) {
  const ab: Vec3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const ac: Vec3 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  const cx = ab[1] * ac[2] - ab[2] * ac[1];
  const cy = ab[2] * ac[0] - ab[0] * ac[2];
  const cz = ab[0] * ac[1] - ab[1] * ac[0];
  return 0.5 * Math.hypot(cx, cy, cz);
}

export function planToThree(x: number, y: number, z: number, plotW: number, plotL: number) {
  return {
    x: x - plotW / 2,
    y: z,
    z: y - plotL / 2,
  };
}

export function threeToPlan(x: number, z: number, plotW: number, plotL: number) {
  return {
    x: x + plotW / 2,
    y: z + plotL / 2,
  };
}

export function gableEnds(model: HouseModel) {
  const over = 0.08;
  const w = model.envelope.w + over * 2;
  const d = model.envelope.l + over * 2;
  const rise = roofRise(model);
  const hw = w / 2;
  const hd = d / 2;
  if (model.spec.roofStyle !== "gable" && model.spec.roofStyle !== "shed") return [];
  if (model.spec.roofStyle === "shed") {
    return [
      {
        id: "gable-w",
        points: [
          [-hw, 0, -hd],
          [-hw, rise, -hd],
          [-hw, 0, hd],
        ] as Vec3[],
      },
      {
        id: "gable-e",
        points: [
          [hw, 0, -hd],
          [hw, rise, -hd],
          [hw, 0, hd],
        ] as Vec3[],
      },
    ];
  }
  return [
    {
      id: "gable-w",
      points: [
        [-hw, 0, -hd],
        [-hw, rise, 0],
        [-hw, 0, hd],
      ] as Vec3[],
    },
    {
      id: "gable-e",
      points: [
        [hw, 0, -hd],
        [hw, rise, 0],
        [hw, 0, hd],
      ] as Vec3[],
    },
  ];
}
