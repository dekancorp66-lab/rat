import { buildHouse, roomArea } from "./layout";
import { estimateHouse } from "./quantities";
import type { HouseSpec } from "./types";

function dxfHeader() {
  return `0\nSECTION\n2\nHEADER\n9\n$INSUNITS\n70\n2\n0\nENDSEC\n0\nSECTION\n2\nTABLES\n0\nTABLE\n2\nLAYER\n0\nLAYER\n2\nROOMS\n70\n0\n62\n7\n0\nLAYER\n2\nDOORS\n70\n0\n62\n1\n0\nLAYER\n2\nTEXT\n70\n0\n62\n8\n0\nENDTAB\n0\nENDSEC\n0\nSECTION\n2\nENTITIES\n`;
}

function polyline(points: [number, number][], layer: string) {
  const closed = [...points, points[0]];
  let s = "";
  for (let i = 0; i < closed.length - 1; i++) {
    const [x1, y1] = closed[i];
    const [x2, y2] = closed[i + 1];
    s += `0\nLINE\n8\n${layer}\n10\n${x1.toFixed(3)}\n20\n${(-y1).toFixed(3)}\n11\n${x2.toFixed(3)}\n21\n${(-y2).toFixed(3)}\n`;
  }
  return s;
}

function text(x: number, y: number, h: number, str: string) {
  return `0\nTEXT\n8\nTEXT\n10\n${x.toFixed(3)}\n20\n${(-y).toFixed(3)}\n40\n${h}\n1\n${str}\n`;
}

export function houseToDxf(spec: HouseSpec, floor: 0 | 1 = 0) {
  const model = buildHouse(spec);
  const rooms = model.rooms.filter((r) => r.floor === floor);
  let body = "";
  for (const r of rooms) {
    body += polyline(
      [
        [r.x, r.y],
        [r.x + r.w, r.y],
        [r.x + r.w, r.y + r.l],
        [r.x, r.y + r.l],
      ],
      "ROOMS",
    );
    body += text(r.x + r.w / 2 - 2, r.y + r.l / 2, 1.1, r.name.toUpperCase());
    body += text(r.x + r.w / 2 - 1.4, r.y + r.l / 2 + 1.6, 0.7, `${Math.round(roomArea(r))} sq ft`);
  }
  for (const o of model.openings.filter((op) => rooms.some((r) => r.id === op.roomId) && op.type === "door")) {
    const [x1, y1] = o.p1;
    const [x2, y2] = o.p2;
    body += `0\nLINE\n8\nDOORS\n10\n${x1.toFixed(3)}\n20\n${(-y1).toFixed(3)}\n11\n${x2.toFixed(3)}\n21\n${(-y2).toFixed(3)}\n`;
  }
  return dxfHeader() + body + `0\nENDSEC\n0\nEOF\n`;
}

export function downloadText(filename: string, textValue: string, mime = "text/plain") {
  const blob = new Blob([textValue], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function specToJson(spec: HouseSpec) {
  return JSON.stringify({ kind: "wadi-house", version: 1, spec }, null, 2);
}

export function parseImported(raw: string): HouseSpec | null {
  try {
    const data = JSON.parse(raw) as { spec?: HouseSpec; kind?: string } & Partial<HouseSpec>;
    if (data && data.spec && data.spec.plotWidth) return data.spec as HouseSpec;
    if (data && typeof data.plotWidth === "number" && typeof data.bedrooms === "number") {
      return data as HouseSpec;
    }
    return null;
  } catch {
    return null;
  }
}

export function estimateCsv(spec: HouseSpec) {
  const e = estimateHouse(spec);
  const rows = ["Item,Detail,Total", ...e.items.map((i) => `${i.label},${i.detail},${i.total}`)];
  rows.push(`Estimated material cost,,${e.materialCost}`);
  return rows.join("\n");
}
