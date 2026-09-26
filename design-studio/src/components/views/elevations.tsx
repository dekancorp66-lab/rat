import { useMemo, useState } from "react";
import { buildingHeight, floorLevel } from "@/lib/house/layout";
import { estimateHouse, formatMoney, roofRise } from "@/lib/house/quantities";
import { downloadText, houseToDxf } from "@/lib/house/export";
import type { HouseModel } from "@/lib/house/types";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

type Face = "front" | "rear" | "left" | "right";
type Pt = [number, number]; // [x along facade (ft), z height above ground (ft)]

const FACES: { id: Face; label: string; facade: string; no: string }[] = [
  { id: "front", label: "Front Elevation", facade: "North facade", no: "01" },
  { id: "rear", label: "Rear Elevation", facade: "South facade", no: "02" },
  { id: "left", label: "Left Elevation", facade: "West facade", no: "03" },
  { id: "right", label: "Right Elevation", facade: "East facade", no: "04" },
];

const OVER = 1.8; // roof overhang (ft) — same value the 3D roof uses
const INK = "#2a221b";

// 13.5 ft -> 13'-6"
function fmtFtIn(ft: number) {
  const total = Math.round(ft * 12);
  const f = Math.floor(total / 12);
  return `${f}'-${total - f * 12}"`;
}

// ---------------------------------------------------------------------------
// Roof silhouette for one facade. Matches how the 3D roof is built:
//  - gable: ridge runs along the front/rear width, so front/rear see the long
//    slope (a band) and left/right see the triangular gable end.
//  - hip: long sides see a trapezoid, short sides a triangle.
//  - shed: falls from north (high) to south (low).
// `infill` is wall that rises above the eave line (gable ends, shed high wall).
// ---------------------------------------------------------------------------
function roofShape(style: string, face: Face, W: number, D: number, t: number, rise: number) {
  const o = OVER;
  const rect = (z0: number, z1: number): Pt[] => [
    [-o, z0],
    [W + o, z0],
    [W + o, z1],
    [-o, z1],
  ];
  type Shape = {
    outline: Pt[];
    infill: Pt[] | null;
    ridge: [Pt, Pt] | null;
    tiled: boolean;
    fascia: boolean;
    peak: number;
  };
  if (style === "flat") {
    return { outline: rect(t, t + 0.85), infill: null, ridge: null, tiled: false, fascia: false, peak: t + 0.85 } as Shape;
  }
  if (style === "shed") {
    const slab = 0.7;
    if (face === "front") {
      return {
        outline: rect(t + rise - slab, t + rise),
        infill: [[0, t], [W, t], [W, t + rise - slab], [0, t + rise - slab]],
        ridge: null,
        tiled: false,
        fascia: false,
        peak: t + rise,
      } as Shape;
    }
    if (face === "rear") {
      return { outline: rect(t, t + rise), infill: null, ridge: null, tiled: true, fascia: true, peak: t + rise } as Shape;
    }
    const hiLeft = face === "left";
    const under = (x: number) => {
      const k = (x + o) / (W + 2 * o);
      return t + (rise - slab) * (hiLeft ? 1 - k : k);
    };
    return {
      outline: [[-o, under(-o)], [-o, under(-o) + slab], [W + o, under(W + o) + slab], [W + o, under(W + o)]],
      infill: [[0, t], [0, under(0)], [W, under(W)], [W, t]],
      ridge: null,
      tiled: false,
      fascia: false,
      peak: t + rise,
    } as Shape;
  }
  if (style === "gable") {
    if (face === "front" || face === "rear") {
      return {
        outline: rect(t, t + rise),
        infill: null,
        ridge: [[-o, t + rise], [W + o, t + rise]],
        tiled: true,
        fascia: true,
        peak: t + rise,
      } as Shape;
    }
    return {
      outline: [[-o, t], [W / 2, t + rise], [W + o, t]],
      infill: [[0, t], [W / 2, t + rise - 0.8], [W, t]],
      ridge: null,
      tiled: false,
      fascia: false,
      peak: t + rise,
    } as Shape;
  }
  // hip
  const half = (W - D) / 2;
  if (half > 0.01) {
    return {
      outline: [[-o, t], [W / 2 - half, t + rise], [W / 2 + half, t + rise], [W + o, t]],
      infill: null,
      ridge: [[W / 2 - half, t + rise], [W / 2 + half, t + rise]],
      tiled: true,
      fascia: true,
      peak: t + rise,
    } as Shape;
  }
  return {
    outline: [[-o, t], [W / 2, t + rise], [W + o, t]],
    infill: null,
    ridge: null,
    tiled: true,
    fascia: true,
    peak: t + rise,
  } as Shape;
}

function geometry(model: HouseModel, face: Face) {
  const env = model.envelope;
  const plinth = model.plinthH;
  const top = buildingHeight(model);
  const rise = roofRise(model);
  const horizontal = face === "front" || face === "rear";
  const W = horizontal ? env.w : env.l;
  const D = horizontal ? env.l : env.w;

  // Only openings in EXTERIOR walls belong on a facade (interior doors used to leak onto it).
  // Viewed from outside, the front (north) and right (east) faces read east-to-west, so mirror those.
  const sideOf: Record<Face, "n" | "s" | "w" | "e"> = { front: "n", rear: "s", left: "w", right: "e" };
  const mirror = face === "front" || face === "right";
  const openings = model.walls
    .filter((wl) => !wl.interior && wl.side === sideOf[face])
    .flatMap((wl) => wl.openings.map((o) => ({ wl, o })))
    .map(({ wl, o }) => {
      const start = horizontal ? o.p1[0] - env.x : o.p1[1] - env.y;
      return {
        x: mirror ? W - start - o.width : start,
        z: floorLevel(model, wl.floor) + o.sill,
        w: o.width,
        h: o.height,
        door: o.type === "door",
      };
    });

  return { W, D, plinth, top, rise, openings, roof: roofShape(model.spec.roofStyle, face, W, D, top, rise) };
}

// ---------------------------------------------------------------------------
// One rendered facade drawing
// ---------------------------------------------------------------------------
function ElevationDrawing({ model, face }: { model: HouseModel; face: Face }) {
  const g = useMemo(() => geometry(model, face), [model, face]);
  const { W, plinth, top, rise, openings, roof } = g;
  const style = model.spec.roofStyle;
  const p = `el-${face}-`; // unique gradient/pattern ids per drawing

  // Text size scales with drawing width so labels stay about the same size on screen.
  const fs = (W + 24) / 54;
  const mL = 6.5;
  const mR = 15.5 * fs;
  const gy = roof.peak + 3.5; // y of the ground line (svg y grows downward)
  const groundDepth = 2.4;
  const dimY = gy + groundDepth + 2.2;
  const vbW = W + mL + mR;
  const vbH = dimY + fs * 2.4;
  const Y = (z: number) => gy - z;
  const path = (pts: Pt[]) => pts.map((q, i) => `${i ? "L" : "M"} ${q[0].toFixed(3)} ${Y(q[1]).toFixed(3)}`).join(" ") + " Z";
  const H = roof.peak;

  // Level markers on the right-hand side, nudged apart so labels never overlap.
  const levelDefs: { z: number; label: string }[] = [
    { z: 0, label: "GROUND" },
    { z: plinth, label: "FLOOR LEVEL" },
    ...(model.stories === 2 ? [{ z: floorLevel(model, 1), label: "FIRST FLOOR" }] : []),
    { z: top, label: style === "flat" ? "ROOF SLAB" : style === "shed" ? "LOW EAVE" : "EAVES" },
    ...(rise > 1 ? [{ z: roof.peak, label: style === "shed" ? "HIGH POINT" : "RIDGE" }] : []),
  ];
  const levels = levelDefs.sort((a, b) => a.z - b.z);
  const labelY: number[] = [];
  levels.forEach((lv, i) => {
    let y = Y(lv.z);
    if (i > 0 && y > labelY[i - 1] - fs * 1.25) y = labelY[i - 1] - fs * 1.25;
    labelY.push(y);
  });
  const lvX = W + OVER + 0.6;
  const fmtLevel = (z: number) => (z === 0 ? `±0'-0"` : `+${fmtFtIn(z)}`);

  const upperFloorZ = model.stories === 2 ? floorLevel(model, 1) : null;
  const tree = { cx: -2.4, r: Math.max(4, H * 0.27) };

  return (
    <svg viewBox={`${-mL} 0 ${vbW} ${vbH}`} className="block h-auto w-full" role="img" aria-label={`${face} elevation`}>
      <defs>
        <linearGradient id={`${p}sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#dbe9f3" />
          <stop offset="0.65" stopColor="#f1f5f6" />
          <stop offset="1" stopColor="#fffcf7" />
        </linearGradient>
        <linearGradient id={`${p}wall`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f8f2e7" />
          <stop offset="1" stopColor="#eadfcc" />
        </linearGradient>
        <linearGradient id={`${p}light`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.16" />
          <stop offset="0.55" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="1" stopColor="#3b2a1a" stopOpacity="0.12" />
        </linearGradient>
        <linearGradient id={`${p}roof`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d5643f" />
          <stop offset="1" stopColor="#a63f27" />
        </linearGradient>
        <linearGradient id={`${p}glass`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#dcecf6" />
          <stop offset="1" stopColor="#86b1cb" />
        </linearGradient>
        <linearGradient id={`${p}door`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#8d573c" />
          <stop offset="1" stopColor="#643a29" />
        </linearGradient>
        <linearGradient id={`${p}eave`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a1a10" stopOpacity="0.34" />
          <stop offset="1" stopColor="#2a1a10" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${p}leaf`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8fae86" />
          <stop offset="1" stopColor="#5f8058" />
        </linearGradient>
        <pattern id={`${p}tiles`} width="1.3" height="0.62" patternUnits="userSpaceOnUse">
          <path d="M0 0.62H1.3M0.65 0V0.62" stroke="#6e2717" strokeOpacity="0.5" strokeWidth="0.05" fill="none" />
        </pattern>
        <pattern id={`${p}stone`} width="1.8" height="0.68" patternUnits="userSpaceOnUse">
          <path d="M0 0.68H1.8M0.9 0V0.68" stroke="#7b6247" strokeOpacity="0.55" strokeWidth="0.05" fill="none" />
        </pattern>
        <pattern id={`${p}hatch`} width="1.2" height="1.2" patternUnits="userSpaceOnUse">
          <path d="M-0.2 1.4L1.4 -0.2" stroke="#a89c86" strokeWidth="0.06" fill="none" />
        </pattern>
      </defs>

      {/* sky + ground */}
      <rect x={-mL} y={0} width={vbW} height={gy} fill={`url(#${p}sky)`} />
      <rect x={-mL} y={gy} width={vbW} height={groundDepth} fill="#e7dfcd" />
      <rect x={-mL} y={gy} width={vbW} height={groundDepth} fill={`url(#${p}hatch)`} />
      <rect x={-mL} y={gy + groundDepth} width={vbW} height={vbH - gy - groundDepth} fill="#fffcf7" />

      {/* soft tree behind the building, gives depth */}
      <g opacity="0.92">
        <rect x={tree.cx - 0.3} y={gy - tree.r * 1.1} width={0.6} height={tree.r * 1.1} fill="#6a5443" />
        <circle cx={tree.cx - 1.6} cy={gy - tree.r * 1.9} r={tree.r * 0.8} fill={`url(#${p}leaf)`} />
        <circle cx={tree.cx + 1.4} cy={gy - tree.r * 1.6} r={tree.r * 0.95} fill={`url(#${p}leaf)`} />
        <circle cx={tree.cx - 0.2} cy={gy - tree.r * 2.5} r={tree.r * 0.7} fill="#7a9b71" />
      </g>

      {/* roof */}
      <path d={path(roof.outline)} fill={`url(#${p}roof)`} stroke={INK} strokeWidth={0.1} strokeLinejoin="round" />
      {roof.tiled && <path d={path(roof.outline)} fill={`url(#${p}tiles)`} />}
      {roof.fascia && (
        <path d={path([[-OVER, top], [W + OVER, top], [W + OVER, top + 0.38], [-OVER, top + 0.38]])} fill="#5a2818" stroke={INK} strokeWidth={0.06} />
      )}
      {roof.ridge && (
        <line x1={roof.ridge[0][0]} y1={Y(roof.ridge[0][1])} x2={roof.ridge[1][0]} y2={Y(roof.ridge[1][1])} stroke="#5a2818" strokeWidth={0.42} strokeLinecap="round" />
      )}
      {roof.infill && <path d={path(roof.infill)} fill={`url(#${p}wall)`} stroke={INK} strokeWidth={0.08} />}
      {roof.infill && <path d={path(roof.infill)} fill={`url(#${p}light)`} />}

      {/* walls + plinth */}
      <rect x={0} y={Y(top)} width={W} height={top - plinth} fill={`url(#${p}wall)`} stroke={INK} strokeWidth={0.1} />
      <rect x={0} y={Y(top)} width={W} height={top - plinth} fill={`url(#${p}light)`} />
      <rect x={0} y={Y(plinth)} width={W} height={plinth} fill="#c9ad8a" stroke={INK} strokeWidth={0.1} />
      <rect x={0} y={Y(plinth)} width={W} height={plinth} fill={`url(#${p}stone)`} />
      {upperFloorZ !== null && (
        <rect x={-0.15} y={Y(upperFloorZ)} width={W + 0.3} height={model.slabT} fill="#e3d7c2" stroke={INK} strokeWidth={0.05} />
      )}
      {!roof.infill && <rect x={0} y={Y(top)} width={W} height={1.25} fill={`url(#${p}eave)`} />}

      {/* windows and doors */}
      {openings.map((o, i) => {
        const yTop = Y(o.z + o.h);
        if (!o.door) {
          const panes = o.w >= 6 ? 3 : o.w >= 3.2 ? 2 : 1;
          const gx = o.x + 0.16;
          const gw = o.w - 0.32;
          const gyT = yTop + 0.16;
          const gh = o.h - 0.32;
          return (
            <g key={i}>
              <rect x={o.x - 0.2} y={yTop - 0.32} width={o.w + 0.4} height={0.32} fill="#e6dcc8" stroke={INK} strokeWidth={0.05} />
              <rect x={o.x} y={yTop} width={o.w} height={o.h} fill="#3a3029" stroke={INK} strokeWidth={0.06} />
              <clipPath id={`${p}c${i}`}>
                <rect x={gx} y={gyT} width={gw} height={gh} />
              </clipPath>
              <rect x={gx} y={gyT} width={gw} height={gh} fill={`url(#${p}glass)`} />
              <g clipPath={`url(#${p}c${i})`}>
                <path d={`M ${gx + gw * 0.14} ${gyT} L ${gx + gw * 0.4} ${gyT} L ${gx + gw * 0.14} ${gyT + gh} L ${gx - gw * 0.12} ${gyT + gh} Z`} fill="#ffffff" fillOpacity="0.32" />
                <rect x={gx} y={gyT} width={gw} height={0.4} fill="#0d2233" fillOpacity="0.22" />
              </g>
              {Array.from({ length: panes - 1 }, (_, k) => (
                <rect key={k} x={gx + (gw * (k + 1)) / panes - 0.07} y={gyT} width={0.14} height={gh} fill="#3a3029" />
              ))}
              {o.h >= 3.4 && <rect x={gx} y={gyT + gh * 0.32} width={gw} height={0.12} fill="#3a3029" />}
              <rect x={o.x - 0.28} y={Y(o.z)} width={o.w + 0.56} height={0.3} fill="#efe6d4" stroke={INK} strokeWidth={0.05} />
            </g>
          );
        }
        const groundDoor = o.z <= plinth + 0.05;
        const half = plinth / 2;
        return (
          <g key={i}>
            {groundDoor && (
              <>
                <rect x={o.x - 0.95} y={gy - half} width={o.w + 1.9} height={half} fill="#ddd3c1" stroke={INK} strokeWidth={0.06} />
                <rect x={o.x - 0.5} y={gy - plinth} width={o.w + 1} height={half} fill="#e8dfce" stroke={INK} strokeWidth={0.06} />
              </>
            )}
            <rect x={o.x - 0.2} y={yTop - 0.2} width={o.w + 0.4} height={o.h + 0.2} fill="#e6dcc8" stroke={INK} strokeWidth={0.06} />
            <rect x={o.x} y={yTop} width={o.w} height={o.h} fill={`url(#${p}door)`} stroke={INK} strokeWidth={0.07} />
            {[0, 1].map((r) =>
              [0, 1].map((c) => {
                const pw = (o.w - 0.9) / 2;
                const ph = (o.h - 0.9) / 2;
                return (
                  <rect key={`${r}${c}`} x={o.x + 0.3 + c * (pw + 0.3)} y={yTop + 0.3 + r * (ph + 0.3)} width={pw} height={ph} fill="#a06a4c" fillOpacity="0.55" stroke="#3f2417" strokeOpacity="0.7" strokeWidth={0.05} />
                );
              }),
            )}
            <circle cx={o.x + o.w * 0.84} cy={yTop + o.h * 0.52} r={0.14} fill="#d9b45a" stroke="#6b4e12" strokeWidth={0.03} />
          </g>
        );
      })}

      {/* low shrubs + a person for scale */}
      <ellipse cx={1.7} cy={gy - 0.45} rx={1.7} ry={0.95} fill="#6f8f66" stroke="#4a6642" strokeWidth={0.05} />
      <ellipse cx={W - 1.7} cy={gy - 0.45} rx={1.7} ry={0.95} fill="#6f8f66" stroke="#4a6642" strokeWidth={0.05} />
      <g fill="#4a4038" fillOpacity="0.82">
        <circle cx={-4.6} cy={gy - 5.25} r={0.42} />
        <rect x={-5.2} y={gy - 4.75} width={1.2} height={2.35} rx={0.45} />
        <rect x={-5.05} y={gy - 2.5} width={0.5} height={2.5} rx={0.2} />
        <rect x={-4.55} y={gy - 2.5} width={0.5} height={2.5} rx={0.2} />
      </g>

      {/* ground line */}
      <line x1={-mL} y1={gy} x2={W + mR} y2={gy} stroke={INK} strokeWidth={0.22} />

      {/* overall width dimension */}
      <g stroke="#59504a" strokeWidth={0.06}>
        <line x1={0} y1={dimY - 0.6} x2={0} y2={gy + groundDepth + 0.4} strokeOpacity="0.6" />
        <line x1={W} y1={dimY - 0.6} x2={W} y2={gy + groundDepth + 0.4} strokeOpacity="0.6" />
        <line x1={0} y1={dimY} x2={W} y2={dimY} />
        <line x1={-0.35} y1={dimY + 0.35} x2={0.35} y2={dimY - 0.35} strokeWidth={0.1} />
        <line x1={W - 0.35} y1={dimY + 0.35} x2={W + 0.35} y2={dimY - 0.35} strokeWidth={0.1} />
      </g>
      <text x={W / 2} y={dimY + fs * 1.15} textAnchor="middle" fontFamily="Outfit, Arial, sans-serif" fontSize={fs} fill="#3c342d" fontWeight={600}>
        {fmtFtIn(W)}
      </text>

      {/* level markers */}
      {levels.map((lv, i) => {
        const y = Y(lv.z);
        const mx = lvX + 2.2;
        return (
          <g key={lv.label}>
            <line x1={lvX} y1={y} x2={mx + 0.9} y2={y} stroke="#8a8175" strokeWidth={0.05} strokeDasharray="0.35 0.25" />
            <path d={`M ${mx - 0.42} ${y - 0.7} L ${mx + 0.42} ${y - 0.7} L ${mx} ${y} Z`} fill={INK} />
            <line x1={mx - 0.9} y1={y} x2={mx + 0.9} y2={y} stroke={INK} strokeWidth={0.07} />
            <text x={mx + 1.4} y={labelY[i] + fs * 0.35} fontFamily="Outfit, Arial, sans-serif" fontSize={fs} fill={INK}>
              <tspan fontWeight={700}>{fmtLevel(lv.z)}</tspan>
              <tspan dx={fs * 0.5} fill="#7a7268" fontSize={fs * 0.82}>
                {lv.label}
              </tspan>
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function ElevationCard({ model, face }: { model: HouseModel; face: (typeof FACES)[number] }) {
  const W = face.id === "front" || face.id === "rear" ? model.envelope.w : model.envelope.l;
  return (
    <figure className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
      <figcaption className="flex items-center justify-between gap-3 px-5 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <span className="grid size-8 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-fg tabular-nums">
            {face.no}
          </span>
          <div>
            <p className="font-display text-lg leading-tight">{face.label}</p>
            <p className="text-xs text-muted">{face.facade}</p>
          </div>
        </div>
        <span className="rounded-full bg-chip px-3 py-1 text-xs text-muted tabular-nums">{fmtFtIn(W)} wide</span>
      </figcaption>
      <ElevationDrawing model={model} face={face.id} />
    </figure>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export function ElevationsView({ model }: { model: HouseModel }) {
  const [focus, setFocus] = useState<"all" | Face>("all");
  const est = estimateHouse(model.spec);
  const roofItems = est.items.filter((i) => i.group === "roof");
  const roofCost = roofItems.reduce((s, i) => s + i.total, 0);
  const eaves = buildingHeight(model);
  const ridge = eaves + roofRise(model);
  const shown = focus === "all" ? FACES : FACES.filter((f) => f.id === focus);

  return (
    // ONE scroll container for the whole view, so the materials panel can never be clipped.
    <div className="h-full min-h-0 overflow-y-auto pr-1">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(260px,300px)] lg:items-start">
        <section className="min-w-0">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl">Architectural Projections</h2>
              <p className="text-sm text-muted">Scale 1 : 100</p>
            </div>
            <div className="no-print flex flex-wrap items-center gap-1 rounded-full bg-surface p-1 shadow-sm">
              {[{ id: "all" as const, label: "All four" }, ...FACES.map((f) => ({ id: f.id, label: f.label.replace(" Elevation", "") }))].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setFocus(t.id)}
                  className={`min-h-9 rounded-full px-3.5 py-1.5 text-sm ${focus === t.id ? "bg-chip font-medium text-primary" : "text-muted hover:text-fg"}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className={`grid gap-5 ${focus === "all" ? "2xl:grid-cols-2" : ""}`}>
            {shown.map((f) => (
              <ElevationCard key={f.id} model={model} face={f} />
            ))}
          </div>
        </section>

        <aside className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <p className="text-sm font-medium">Materials & Estimates</p>

          <div className="mt-3 rounded-md bg-sage-soft px-4 py-3">
            <p className="text-[11px] tracking-wide text-sage uppercase">Total Roof Area</p>
            <p className="font-display text-2xl text-sage tabular-nums">{Math.round(est.roofArea).toLocaleString()} sq ft</p>
          </div>

          {/* Total + CAD button live at the TOP so they are visible without scrolling */}
          <div className="mt-3 rounded-md bg-primary-soft px-4 py-3">
            <p className="text-[11px] tracking-wide text-primary uppercase">Roof materials</p>
            <p className="text-2xl font-semibold text-primary tabular-nums">{formatMoney(roofCost)}</p>
          </div>
          <Button
            className="mt-3 w-full rounded-full"
            onClick={() =>
              downloadText(
                `${model.spec.name.replace(/\s+/g, "-").toLowerCase()}.dxf`,
                houseToDxf(model.spec, 0),
                "application/dxf",
              )
            }
          >
            <Download /> Download CAD (DXF)
          </Button>

          <div className="mt-5 grid grid-cols-2 gap-2 text-sm">
            {[
              ["Eaves height", fmtFtIn(eaves)],
              [model.spec.roofStyle === "flat" ? "Roof top" : "Ridge height", fmtFtIn(ridge)],
              ["Plinth", fmtFtIn(model.plinthH)],
              ["Storeys", String(model.stories)],
            ].map(([k, v]) => (
              <div key={k} className="rounded-md bg-surface-2 px-3 py-2">
                <p className="text-[10px] tracking-wide text-muted uppercase">{k}</p>
                <p className="font-medium tabular-nums">{v}</p>
              </div>
            ))}
          </div>

          <p className="mt-5 text-[11px] tracking-[0.16em] text-muted uppercase">Roof components</p>
          <ul className="mt-2 divide-y divide-border">
            {roofItems.map((i) => (
              <li key={i.id} className="flex items-start justify-between gap-3 py-2.5 text-sm">
                <span>
                  <span className="block">{i.label}</span>
                  <span className="text-xs text-muted">{i.detail}</span>
                </span>
                <span className="tabular-nums">{formatMoney(i.total)}</span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
