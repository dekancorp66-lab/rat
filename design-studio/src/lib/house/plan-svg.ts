import { roomArea, roomsOnFloor } from "./layout";
import type { HouseModel, Opening, Room, WallSeg, WallSide } from "./types";

// ---------------------------------------------------------------------------
// Drawing conventions (why this looks "professional")
//  - Flat, black-on-white: architectural sheets have no shadows or pastel fills.
//  - Walls are solid black; exterior walls are thicker than interior ones.
//  - Windows = 3 thin parallel lines inside the wall; doors = leaf + quarter arc.
//  - Dimensions use 45° slash ticks and extension lines (the standard style).
//  - Every sheet has a border, north arrow, scale bar and a title block.
// 1 SVG unit = 1 foot.
// ---------------------------------------------------------------------------

const INK = "#111111";
const GREY = "#6b6b6b";
const FONT = "Arial, Helvetica, sans-serif";
// White outline behind text so labels stay readable on top of furniture lines.
// Drawn as two stacked <text> elements (halo, then fill) because `paint-order`
// is ignored by some SVG viewers/editors.
function haloText(attrs: string, content: string, fill: string) {
  return `<text ${attrs} fill="none" stroke="#ffffff" stroke-width="0.28" stroke-linejoin="round">${content}</text><text ${attrs} fill="${fill}">${content}</text>`;
}

function unit(wall: WallSeg) {
  const len = Math.hypot(wall.x2 - wall.x1, wall.y2 - wall.y1) || 1;
  return { len, dx: (wall.x2 - wall.x1) / len, dy: (wall.y2 - wall.y1) / len };
}

// Point at distance `t` along a wall. `t` may be <0 or >len (used to extend wall ends).
function along(wall: WallSeg, t: number) {
  const { len } = unit(wall);
  const u = t / len;
  return { x: wall.x1 + (wall.x2 - wall.x1) * u, y: wall.y1 + (wall.y2 - wall.y1) * u };
}

function inward(side: WallSide): [number, number] {
  switch (side) {
    case "n":
      return [0, 1];
    case "s":
      return [0, -1];
    case "w":
      return [1, 0];
    default:
      return [-1, 0];
  }
}

// 13.5 ft -> 13'-6"  (architects read feet-inches, not decimals)
function fmtFtIn(ft: number) {
  const total = Math.round(ft * 12);
  const f = Math.floor(total / 12);
  const i = total - f * 12;
  return `${f}'-${i}"`;
}

function line(x1: number, y1: number, x2: number, y2: number, sw: number, color = INK, extra = "") {
  return `<line x1="${x1.toFixed(3)}" y1="${y1.toFixed(3)}" x2="${x2.toFixed(3)}" y2="${y2.toFixed(3)}" stroke="${color}" stroke-width="${sw}" ${extra}/>`;
}

// ---- Doors and windows -----------------------------------------------------

function windowSvg(wall: WallSeg, o: Opening, thickness: number) {
  const { dx, dy } = unit(wall);
  const nx = -dy;
  const ny = dx;
  const h = thickness / 2;
  const a = along(wall, o.offset);
  const b = along(wall, o.offset + o.width);
  let out = "";
  // Outer two lines = glass edges of the wall, middle line = glazing.
  for (const k of [-h, 0, h]) {
    out += line(a.x + nx * k, a.y + ny * k, b.x + nx * k, b.y + ny * k, k === 0 ? 0.04 : 0.06);
  }
  // Jamb lines closing the wall thickness at each end of the opening.
  out += line(a.x - nx * h, a.y - ny * h, a.x + nx * h, a.y + ny * h, 0.06);
  out += line(b.x - nx * h, b.y - ny * h, b.x + nx * h, b.y + ny * h, 0.06);
  return out;
}

function doorSvg(wall: WallSeg, o: Opening, thickness: number) {
  const { dx, dy } = unit(wall);
  const nx = -dy;
  const ny = dx;
  const h = thickness / 2;
  const hinge = along(wall, o.offset);
  const closed = along(wall, o.offset + o.width);
  const [ix, iy] = inward(wall.side);
  const open = { x: hinge.x + ix * o.width, y: hinge.y + iy * o.width };
  // Sweep flag: which way the arc turns from the closed leaf to the open leaf.
  const cross = (closed.x - hinge.x) * (open.y - hinge.y) - (closed.y - hinge.y) * (open.x - hinge.x);
  const sweep = cross > 0 ? 1 : 0;
  let out = "";
  out += line(hinge.x - nx * h, hinge.y - ny * h, hinge.x + nx * h, hinge.y + ny * h, 0.06);
  out += line(closed.x - nx * h, closed.y - ny * h, closed.x + nx * h, closed.y + ny * h, 0.06);
  out += line(hinge.x, hinge.y, open.x, open.y, 0.08); // door leaf, drawn open
  out += `<path d="M ${closed.x.toFixed(3)} ${closed.y.toFixed(3)} A ${o.width.toFixed(3)} ${o.width.toFixed(3)} 0 0 ${sweep} ${open.x.toFixed(3)} ${open.y.toFixed(3)}" fill="none" stroke="${INK}" stroke-width="0.04"/>`;
  return out;
}

// ---- Furniture (light grey so it never competes with the walls) ------------

function furnitureMarks(room: Room): string {
  const { x, y, w, l, kind } = room;
  const stroke = "#7d7d7d";
  const fill = "#ffffff";
  if (kind === "living" || kind === "hall") {
    return `
      <rect x="${x + w * 0.16}" y="${y + l * 0.5}" width="${w * 0.5}" height="${l * 0.2}" rx="0.3" fill="${fill}" stroke="${stroke}" stroke-width="0.06"/>
      <rect x="${x + w * 0.16}" y="${y + l * 0.5}" width="${w * 0.14}" height="${l * 0.2}" rx="0.3" fill="none" stroke="${stroke}" stroke-width="0.05"/>
      <rect x="${x + w * 0.32}" y="${y + l * 0.3}" width="${w * 0.22}" height="${l * 0.13}" rx="0.12" fill="${fill}" stroke="${stroke}" stroke-width="0.05"/>
      <rect x="${x + w * 0.72}" y="${y + l * 0.1}" width="${w * 0.18}" height="0.5" rx="0.1" fill="${fill}" stroke="${stroke}" stroke-width="0.05"/>`;
  }
  if (kind === "master" || kind === "bedroom") {
    return `
      <rect x="${x + w * 0.28}" y="${y + l * 0.22}" width="${w * 0.44}" height="${l * 0.42}" rx="0.2" fill="${fill}" stroke="${stroke}" stroke-width="0.06"/>
      <rect x="${x + w * 0.32}" y="${y + l * 0.22}" width="${w * 0.36}" height="${l * 0.1}" rx="0.08" fill="#efefef" stroke="${stroke}" stroke-width="0.05"/>
      <circle cx="${x + w * 0.34}" cy="${y + l * 0.27}" r="0.16" fill="none" stroke="${stroke}" stroke-width="0.04"/>
      <circle cx="${x + w * 0.66}" cy="${y + l * 0.27}" r="0.16" fill="none" stroke="${stroke}" stroke-width="0.04"/>`;
  }
  if (kind === "kitchen") {
    const burners = [0.42, 0.58].flatMap((fx) => [0.45, 0.6].map((fy) => ({ cx: x + w * fx, cy: y + fy * 2.2 + 0.35 })));
    return `
      <rect x="${x + 0.35}" y="${y + 0.35}" width="${w - 0.7}" height="2.2" rx="0.1" fill="${fill}" stroke="${stroke}" stroke-width="0.06"/>
      ${burners.map((b) => `<circle cx="${b.cx}" cy="${b.cy}" r="0.14" fill="none" stroke="${stroke}" stroke-width="0.04"/>`).join("")}
      <rect x="${x + w * 0.15}" y="${y + l * 0.6}" width="${w * 0.32}" height="${l * 0.28}" rx="0.15" fill="none" stroke="${stroke}" stroke-width="0.05"/>`;
  }
  if (kind === "bathroom") {
    return `
      <ellipse cx="${x + w * 0.24}" cy="${y + l * 0.26}" rx="${w * 0.14}" ry="${l * 0.11}" fill="${fill}" stroke="${stroke}" stroke-width="0.05"/>
      <rect x="${x + w * 0.52}" y="${y + l * 0.45}" width="${w * 0.36}" height="${l * 0.38}" rx="0.25" fill="${fill}" stroke="${stroke}" stroke-width="0.05"/>
      <line x1="${x + w * 0.52}" y1="${y + l * 0.5}" x2="${x + w * 0.88}" y2="${y + l * 0.5}" stroke="${stroke}" stroke-width="0.04"/>`;
  }
  if (kind === "dining") {
    const cx = x + w * 0.5;
    const cy = y + l * 0.5;
    const rw = w * 0.36;
    const rl = l * 0.3;
    const chairs = [
      { cx: cx - rw * 0.5, cy: cy - rl * 0.7 },
      { cx: cx + rw * 0.5, cy: cy - rl * 0.7 },
      { cx: cx - rw * 0.5, cy: cy + rl * 0.7 },
      { cx: cx + rw * 0.5, cy: cy + rl * 0.7 },
    ];
    return `
      <rect x="${cx - rw / 2}" y="${cy - rl / 2}" width="${rw}" height="${rl}" rx="0.2" fill="${fill}" stroke="${stroke}" stroke-width="0.06"/>
      ${chairs.map((c) => `<rect x="${c.cx - 0.16}" y="${c.cy - 0.16}" width="0.32" height="0.32" rx="0.08" fill="none" stroke="${stroke}" stroke-width="0.04"/>`).join("")}`;
  }
  if (kind === "study") {
    return `
      <rect x="${x + w * 0.3}" y="${y + 0.4}" width="${w * 0.4}" height="1.6" rx="0.1" fill="${fill}" stroke="${stroke}" stroke-width="0.06"/>
      <rect x="${x + w * 0.44}" y="${y + 2.15}" width="${w * 0.12}" height="0.55" rx="0.1" fill="none" stroke="${stroke}" stroke-width="0.05"/>`;
  }
  if (kind === "verandah" || kind === "balcony") {
    return `
      <circle cx="${x + w * 0.45}" cy="${y + l * 0.55}" r="0.7" fill="${fill}" stroke="${stroke}" stroke-width="0.05"/>
      <circle cx="${x + w * 0.45}" cy="${y + l * 0.55}" r="0.32" fill="none" stroke="${stroke}" stroke-width="0.04"/>`;
  }
  if (kind === "stair") {
    // Treads run across the shorter dimension; a stair is drawn as evenly spaced lines.
    const tread = 0.85;
    let out = `<rect x="${x + 0.15}" y="${y + 0.15}" width="${w - 0.3}" height="${l - 0.3}" fill="none" stroke="${stroke}" stroke-width="0.06"/>`;
    if (l >= w) {
      for (let ty = y + 0.15 + tread; ty < y + l - 0.15; ty += tread) out += line(x + 0.15, ty, x + w - 0.15, ty, 0.04, stroke);
    } else {
      for (let tx = x + 0.15 + tread; tx < x + w - 0.15; tx += tread) out += line(tx, y + 0.15, tx, y + l - 0.15, 0.04, stroke);
    }
    return out;
  }
  return "";
}

// ---- Dimensions -------------------------------------------------------------

function dimLine(x1: number, y1: number, x2: number, y2: number, label: string, offset: number, vertical: boolean) {
  const tick = 0.32;
  if (vertical) {
    const x = x1 - offset;
    return `
      ${line(x1 - 0.5, y1, x - 0.35, y1, 0.04, GREY)}
      ${line(x1 - 0.5, y2, x - 0.35, y2, 0.04, GREY)}
      ${line(x, y1, x, y2, 0.06)}
      ${line(x - tick, y1 + tick, x + tick, y1 - tick, 0.1)}
      ${line(x - tick, y2 + tick, x + tick, y2 - tick, 0.1)}
      ${haloText(`x="${x - 0.6}" y="${(y1 + y2) / 2}" text-anchor="middle" transform="rotate(-90 ${x - 0.6} ${(y1 + y2) / 2})" font-family="${FONT}" font-size="1"`, label, INK)}`;
  }
  const y = y1 - offset;
  return `
    ${line(x1, y1 - 0.5, x1, y - 0.35, 0.04, GREY)}
    ${line(x2, y2 - 0.5, x2, y - 0.35, 0.04, GREY)}
    ${line(x1, y, x2, y, 0.06)}
    ${line(x1 - tick, y + tick, x1 + tick, y - tick, 0.1)}
    ${line(x2 - tick, y + tick, x2 + tick, y - tick, 0.1)}
    ${haloText(`x="${(x1 + x2) / 2}" y="${y - 0.5}" text-anchor="middle" font-family="${FONT}" font-size="1"`, label, INK)}`;
}

// ---- Room labels ------------------------------------------------------------

const CHAR_W = 0.72; // approx width of one bold uppercase char, in em

function fitLabel(name: string, w: number, l: number) {
  const text = name.toUpperCase();
  const avail = Math.max(2, w - 0.8);
  let lines = [text];
  let fs = Math.min(1.05, avail / (text.length * CHAR_W));
  const words = text.split(" ");
  // Too tight on one line? Wrap onto two balanced lines instead of shrinking to nothing.
  if (fs < 0.72 && words.length > 1) {
    let bestLen = text.length;
    for (let i = 1; i < words.length; i++) {
      const a = words.slice(0, i).join(" ");
      const b = words.slice(i).join(" ");
      const m = Math.max(a.length, b.length);
      if (m < bestLen) {
        bestLen = m;
        lines = [a, b];
      }
    }
    fs = Math.min(1.05, avail / (bestLen * CHAR_W));
  }
  fs = Math.max(0.42, Math.min(fs, l / 6));
  return { lines, fs };
}

function roomLabel(r: Room) {
  const { lines, fs } = fitLabel(r.name, r.w, r.l);
  const showSize = r.w >= 4.8 && r.l >= 4.5 && r.kind !== "stair";
  const showArea = showSize && r.w * r.l >= 60;
  const sizeText = `${fmtFtIn(r.w)} × ${fmtFtIn(r.l)}`;
  const sizeFs = Math.max(0.4, Math.min(fs * 0.62, (r.w - 0.8) / (sizeText.length * 0.56)));
  const nameH = lines.length * fs * 1.15;
  const extraH = showSize ? sizeFs * 1.5 + (showArea ? sizeFs * 1.3 : 0) : 0;
  const top = r.y + r.l / 2 - (nameH + extraH) / 2;
  const cx = r.x + r.w / 2;
  let out = "";
  lines.forEach((ln, i) => {
    out += haloText(`x="${cx}" y="${top + fs * 0.85 + i * fs * 1.15}" text-anchor="middle" font-family="${FONT}" font-size="${fs}" font-weight="700" letter-spacing="0.03em"`, escapeXml(ln), INK);
  });
  if (showSize) {
    const sy = top + nameH + sizeFs * 1.0;
    out += haloText(`x="${cx}" y="${sy}" text-anchor="middle" font-family="${FONT}" font-size="${sizeFs}"`, sizeText, GREY);
    if (showArea) {
      out += haloText(`x="${cx}" y="${sy + sizeFs * 1.3}" text-anchor="middle" font-family="${FONT}" font-size="${sizeFs}"`, `${Math.round(roomArea(r))} sq ft`, GREY);
    }
  }
  return out;
}

// ---- Main -------------------------------------------------------------------

export function housePlanSvg(model: HouseModel, floor: 0 | 1) {
  const rooms = roomsOnFloor(model, floor);
  const walls = model.walls.filter((w) => w.floor === floor);
  const env = model.envelope;
  const wt = Math.max(0.3, model.wallT); // exterior wall thickness (ft)
  const thick = (w: WallSeg) => (w.interior ? wt * 0.6 : wt);

  // Sheet margins: room for dimensions (left/top), scale bar + title block (bottom).
  const mL = 6.5;
  const mR = 5;
  const mT = 6.5;
  const mB = 9.5;
  const vb = { x: env.x - mL, y: env.y - mT, w: env.w + mL + mR, h: env.l + mT + mB };
  const inset = 0.5;

  let body = "";
  body += `<defs>
    <pattern id="plan-hatch" width="0.8" height="0.8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="0.8" height="0.8" fill="#ffffff"/>
      <line x1="0" y1="0" x2="0" y2="0.8" stroke="#cfcfcf" stroke-width="0.05"/>
    </pattern>
  </defs>`;
  body += `<rect x="${vb.x}" y="${vb.y}" width="${vb.w}" height="${vb.h}" fill="#ffffff"/>`;

  // 1) Room floors: white; wet rooms light grey; open verandah/balcony hatched.
  for (const r of rooms) {
    const open = r.kind === "verandah" || r.kind === "balcony";
    const fill = open ? "url(#plan-hatch)" : r.kind === "bathroom" ? "#f0f0f0" : "#ffffff";
    body += `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.l}" fill="${fill}" stroke="none"/>`;
    if (open) {
      body += `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.l}" fill="none" stroke="${GREY}" stroke-width="0.05" stroke-dasharray="0.4 0.3"/>`;
    }
  }

  // 2) Furniture goes under the walls.
  for (const r of rooms) body += furnitureMarks(r);

  // 3) Walls: solid black. Wall ends that touch a corner are extended by half the
  //    thickness so corners close cleanly without needing square line caps
  //    (square caps would eat into door/window openings).
  for (const wall of walls) {
    const { len } = unit(wall);
    const t = thick(wall);
    const openings = [...wall.openings].sort((a, b) => a.offset - b.offset);
    let cursor = 0;
    const solids: [number, number][] = [];
    for (const o of openings) {
      const a = Math.max(0, o.offset);
      const b = Math.min(len, o.offset + o.width);
      if (a > cursor + 0.05) solids.push([cursor, a]);
      cursor = Math.max(cursor, b);
    }
    if (len - cursor > 0.05) solids.push([cursor, len]);
    for (const [a, b] of solids) {
      const ea = a <= 0.001 ? -t / 2 : 0;
      const eb = b >= len - 0.001 ? t / 2 : 0;
      const p1 = along(wall, a + ea);
      const p2 = along(wall, b + eb);
      body += line(p1.x, p1.y, p2.x, p2.y, t, INK, `stroke-linecap="butt"`);
    }
  }

  // 4) Doors and windows on top of the walls.
  for (const wall of walls) {
    const t = thick(wall);
    for (const o of wall.openings) {
      body += o.type === "window" ? windowSvg(wall, o, t) : doorSvg(wall, o, t);
    }
  }

  // 5) Labels last so they are never covered.
  for (const r of rooms) body += roomLabel(r);

  // 6) Overall dimensions (top and left).
  body += dimLine(env.x, env.y, env.x + env.w, env.y, fmtFtIn(env.w), 2.6, false);
  body += dimLine(env.x, env.y, env.x, env.y + env.l, fmtFtIn(env.l), 2.6, true);

  // 7) North arrow (top right).
  const nx = vb.x + vb.w - 2.8;
  const ny = vb.y + 3.8;
  body += `<g>
    <circle cx="${nx}" cy="${ny}" r="1.25" fill="#ffffff" stroke="${INK}" stroke-width="0.08"/>
    <polygon points="${nx},${ny - 1.05} ${nx - 0.55},${ny + 0.95} ${nx},${ny + 0.45}" fill="${INK}"/>
    <polygon points="${nx},${ny - 1.05} ${nx + 0.55},${ny + 0.95} ${nx},${ny + 0.45}" fill="#ffffff" stroke="${INK}" stroke-width="0.06"/>
    <text x="${nx}" y="${ny - 1.6}" text-anchor="middle" font-family="${FONT}" font-size="0.9" font-weight="700" fill="${INK}">N</text>
  </g>`;

  // 8) Sheet border + title block.
  const bx = vb.x + inset;
  const by = vb.y + inset;
  const bw = vb.w - inset * 2;
  const bh = vb.h - inset * 2;
  const tbH = 3.8;
  const tbY = by + bh - tbH;
  body += `<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="none" stroke="${INK}" stroke-width="0.14"/>`;
  body += line(bx, tbY, bx + bw, tbY, 0.1);

  // Scale bar (0 - 5 - 10 ft) sitting just above the title block.
  const sx = env.x;
  const sy = tbY - 2.4;
  body += `<g>
    <rect x="${sx}" y="${sy}" width="5" height="0.45" fill="${INK}" stroke="${INK}" stroke-width="0.05"/>
    <rect x="${sx + 5}" y="${sy}" width="5" height="0.45" fill="#ffffff" stroke="${INK}" stroke-width="0.05"/>
    <text x="${sx}" y="${sy - 0.35}" text-anchor="middle" font-family="${FONT}" font-size="0.7" fill="${INK}">0</text>
    <text x="${sx + 5}" y="${sy - 0.35}" text-anchor="middle" font-family="${FONT}" font-size="0.7" fill="${INK}">5</text>
    <text x="${sx + 10}" y="${sy - 0.35}" text-anchor="middle" font-family="${FONT}" font-size="0.7" fill="${INK}">10 ft</text>
  </g>`;

  const floorName = floor === 0 ? "GROUND FLOOR PLAN" : "FIRST FLOOR PLAN";
  const cells: [string, string, number][] = [
    ["PROJECT", model.spec.name, 0.32],
    ["DRAWING", floorName, 0.34],
    ["PLOT", `${model.plot.w} × ${model.plot.l} ft`, 0.2],
    ["SHEET", floor === 0 ? "A-01" : "A-02", 0.14],
  ];
  let cx = bx;
  cells.forEach(([label, value, frac], i) => {
    const cw = bw * frac;
    if (i > 0) body += line(cx, tbY, cx, tbY + tbH, 0.08);
    // Shrink the value text so it always fits inside its cell (bold caps ~0.75em wide).
    const vfs = Math.max(0.5, Math.min(1.05, (cw - 0.9) / (Math.max(4, value.length) * 0.75)));
    body += `<text x="${cx + 0.5}" y="${tbY + 1.0}" font-family="${FONT}" font-size="0.55" letter-spacing="0.08em" fill="${GREY}">${label}</text>`;
    body += `<text x="${cx + 0.5}" y="${tbY + 2.7}" font-family="${FONT}" font-size="${vfs}" font-weight="700" fill="${INK}">${escapeXml(value)}</text>`;
    cx += cw;
  });

  return `<svg id="wadi-plan-svg" xmlns="http://www.w3.org/2000/svg" viewBox="${vb.x} ${vb.y} ${vb.w} ${vb.h}" width="${Math.round(vb.w * 20)}" height="${Math.round(vb.h * 20)}" class="h-full max-h-[72vh] w-full">
${body}
</svg>`;
}

function escapeXml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function downloadSvg(filename: string, svg: string) {
  const blob = new Blob([svg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
