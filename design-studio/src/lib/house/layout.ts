import type {
  HouseModel,
  HouseSpec,
  Opening,
  Room,
  RoomKind,
  WallSeg,
  WallSide,
} from "./types";

const EPS = 0.08;

export function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function round1(n: number) {
  return Math.round(n * 100) / 100;
}

function uid(prefix: string, i: number) {
  return `${prefix}-${i}`;
}

export function normalizeSpec(spec: HouseSpec): HouseSpec {
  const bedrooms = clamp(Math.round(spec.bedrooms), 1, 5);
  const bathrooms = clamp(Math.round(spec.bathrooms), 1, 3);
  const stories: 1 | 2 = spec.stories === 2 || (spec.stories !== 1 && bedrooms >= 4) ? 2 : 1;
  return {
    ...spec,
    bedrooms,
    bathrooms,
    stories,
    plotWidth: clamp(spec.plotWidth, 24, 90),
    plotLength: clamp(spec.plotLength, 28, 110),
    livingRoomWidthPct: clamp(spec.livingRoomWidthPct, 28, 70),
    kitchenWidthPct: clamp(spec.kitchenWidthPct, 18, 50),
    bedroomSize: clamp(spec.bedroomSize, 10, 20),
    floorHeight: clamp(spec.floorHeight, 8, 14),
    wallThickness: clamp(spec.wallThickness, 6, 14),
  };
}

function pushRoom(rooms: Room[], room: Room) {
  if (room.w < 0.5 || room.l < 0.5) return;
  rooms.push({
    ...room,
    x: round1(room.x),
    y: round1(room.y),
    w: round1(room.w),
    l: round1(room.l),
  });
}


// ---------------------------------------------------------------------------------------------
// Room planning
//
// The plan is built in bands so it always tiles the envelope exactly (no gaps, no overlaps):
//   front band  : verandah / living / dining
//   rear band   : west column (kitchen, dining, extras) | spine (passage + stair) | east zone (beds+baths)
// Inside a column, rooms are sized from target areas by order-preserving bisection, so a bedroom
// is always followed by its bathroom and nothing balloons to fill leftover space: if a zone is
// much bigger than its rooms need, study / store rooms absorb the difference.
// ---------------------------------------------------------------------------------------------

type Rect = { x: number; y: number; w: number; l: number };
type Item = { id: string; name: string; kind: RoomKind; pref: number };

const sum = (a: number[]) => a.reduce((s, v) => s + v, 0);

function slice(rect: Rect, items: Item[]): { item: Item; rect: Rect }[] {
  if (items.length === 0) return [];
  if (items.length === 1) return [{ item: items[0], rect }];
  const total = sum(items.map((i) => i.pref));
  let acc = 0;
  let k = 1;
  let best = Infinity;
  for (let i = 1; i < items.length; i++) {
    acc += items[i - 1].pref;
    const d = Math.abs(acc - total / 2);
    if (d < best) {
      best = d;
      k = i;
    }
  }
  const left = items.slice(0, k);
  const right = items.slice(k);
  const frac = sum(left.map((i) => i.pref)) / total;
  // Try a cut in each direction and keep the one whose worst room is closest to square, so a small
  // room (a bathroom) never becomes a long thin strip just because the zone is wide.
  const vert = (): [Rect, Rect] => {
    const w1 = rect.w * frac;
    return [{ ...rect, w: w1 }, { x: rect.x + w1, y: rect.y, w: rect.w - w1, l: rect.l }];
  };
  const horiz = (): [Rect, Rect] => {
    const l1 = rect.l * frac;
    return [{ ...rect, l: l1 }, { x: rect.x, y: rect.y + l1, w: rect.w, l: rect.l - l1 }];
  };
  const worst = ([a, b]: [Rect, Rect]) =>
    Math.max(a.w / a.l, a.l / a.w, b.w / b.l, b.l / b.w);
  const cutV = vert();
  const cutH = horiz();
  const [r1, r2] = worst(cutV) <= worst(cutH) ? cutV : cutH;
  return [...slice(r1, left), ...slice(r2, right)];
}

/** Rooms that soak up leftover space in a zone, so no bedroom ever has to balloon to fill it. */
function fillRect(rooms: Room[], floor: 0 | 1, rect: Rect, prefix: string) {
  // A long thin leftover strip becomes several ordinary rooms instead of one corridor-shaped study.
  const long = Math.max(rect.w, rect.l);
  const short = Math.min(rect.w, rect.l);
  const k = Math.min(4, Math.max(1, Math.ceil(long / (short * 2.2))));
  if (k > 1) {
    for (let i = 0; i < k; i++) {
      const piece: Rect =
        rect.l >= rect.w
          ? { x: rect.x, y: rect.y + (rect.l / k) * i, w: rect.w, l: rect.l / k }
          : { x: rect.x + (rect.w / k) * i, y: rect.y, w: rect.w / k, l: rect.l };
      fillRect(rooms, floor, piece, `${prefix}-${i}`);
    }
    return;
  }
  const a = rect.w * rect.l;
  const items: Item[] =
    a < 110
      ? [{ id: `${prefix}-store`, name: "Store", kind: "store", pref: 70 }]
      : a < 260
        ? [{ id: `${prefix}-study`, name: "Study", kind: "study", pref: 140 }]
        : a < 460
          ? [
              { id: `${prefix}-study`, name: "Study", kind: "study", pref: 150 },
              { id: `${prefix}-store`, name: "Store", kind: "store", pref: 70 },
            ]
          : [
              { id: `${prefix}-study`, name: "Study", kind: "study", pref: 150 },
              { id: `${prefix}-reading`, name: "Reading Room", kind: "study", pref: 130 },
              { id: `${prefix}-store`, name: "Store", kind: "store", pref: 70 },
            ];
  for (const { item, rect: r } of slice(rect, items)) {
    pushRoom(rooms, { id: item.id, name: item.name, kind: item.kind, floor, x: r.x, y: r.y, w: r.w, l: r.l });
  }
}

/** One bedroom (+ its bathroom and a dressing closet), or a lone bedroom / bathroom, in a rectangle. */
function unitRooms(rooms: Room[], floor: 0 | 1, r: Rect, unit: Item[]) {
  const bed = unit.find((i) => i.kind === "bedroom" || i.kind === "master");
  const bath = unit.find((i) => i.kind === "bathroom");
  const add = (it: { id: string; name: string; kind: RoomKind }, x: Rect) =>
    pushRoom(rooms, { ...it, floor, x: x.x, y: x.y, w: x.w, l: x.l });
  if (bed && bath) {
    const bw = Math.min(clamp(r.w * 0.34, 5.5, 8), r.w * 0.45);
    add(bed, { x: r.x, y: r.y, w: r.w - bw, l: r.l });
    const bh = clamp(56 / bw, 6.5, r.l * 0.62);
    const dh = r.l - bh;
    const cx = r.x + r.w - bw;
    if (dh >= 4.5) {
      add(bath, { x: cx, y: r.y, w: bw, l: bh });
      add({ id: `${bed.id}-dress`, name: "Dressing", kind: "store" }, { x: cx, y: r.y + bh, w: bw, l: dh });
    } else {
      add(bath, { x: cx, y: r.y, w: bw, l: r.l });
    }
  } else if (bath) {
    // A spare bathroom: give it a study beside it rather than a bathroom the size of a bedroom.
    const bw = Math.min(clamp(r.w * 0.4, 5.5, 8), r.w * 0.5);
    const bh = Math.min(9, r.l);
    const cx = r.x + r.w - bw;
    add({ id: `${bath.id}-study`, name: "Study", kind: "study" }, { x: r.x, y: r.y, w: r.w - bw, l: r.l });
    if (r.l - bh >= 4.5) {
      add(bath, { x: cx, y: r.y, w: bw, l: bh });
      add({ id: `${bath.id}-store`, name: "Store", kind: "store" }, { x: cx, y: r.y + bh, w: bw, l: r.l - bh });
    } else {
      add(bath, { x: cx, y: r.y, w: bw, l: r.l });
    }
  } else if (bed) {
    // A bedroom without a bathroom in a wide slot keeps its own size; the rest is a wardrobe.
    const bedW = Math.min(r.w, Math.max(r.l * 0.85, bed.pref ** 0.5 * 1.1));
    if (r.w - bedW >= 3.5) {
      add(bed, { x: r.x, y: r.y, w: bedW, l: r.l });
      add({ id: `${bed.id}-dress`, name: "Wardrobe", kind: "store" }, { x: r.x + bedW, y: r.y, w: r.w - bedW, l: r.l });
    } else {
      add(bed, r);
    }
  }
}

/**
 * Lay bedroom units out on a grid sized from bedroomSize. Whatever the grid does not need
 * (extra width or depth) becomes a study / store instead of stretching the bedrooms.
 */
function packCell(rooms: Room[], floor: 0 | 1, rect: Rect, units: Item[][], prefix: string, bs: number) {
  const n = units.length;
  if (n === 0) {
    fillRect(rooms, floor, rect, prefix);
    return;
  }
  const hasBath = units.some((u) => u.some((i) => i.kind === "bathroom"));
  const uw0 = bs + (hasBath ? 7 : 0);
  const ul0 = Math.max(bs * 1.05, hasBath ? 11.5 : 0);
  let c = clamp(Math.round(rect.w / uw0), 1, Math.min(3, n));
  if (c > 1 && rect.w / c < uw0 * 0.8) c -= 1;
  const rows = Math.ceil(n / c);
  let colW = rect.w / c;
  let fillCol: Rect | null = null;
  if (colW > uw0 * 1.25 && rect.w - uw0 * 1.25 * c >= 5) {
    colW = uw0 * 1.25;
    fillCol = { x: rect.x + colW * c, y: rect.y, w: rect.w - colW * c, l: rect.l };
  }
  const usableW = colW * c;
  let rowH = rect.l / rows;
  let fillRow: Rect | null = null;
  if (rowH > ul0 * 1.25 && rect.l - ul0 * 1.25 * rows >= 4.5) {
    rowH = ul0 * 1.25;
    fillRow = { x: rect.x, y: rect.y + rowH * rows, w: usableW, l: rect.l - rowH * rows };
  }
  units.forEach((u, i) => {
    const col = i % c;
    const row = Math.floor(i / c);
    unitRooms(rooms, floor, { x: rect.x + col * colW, y: rect.y + row * rowH, w: colW, l: rowH }, u);
  });
  // Empty grid slots (e.g. 3 units in a 2x2 grid) also become a store so the plan still tiles.
  for (let i = n; i < rows * c; i++) {
    const col = i % c;
    const row = Math.floor(i / c);
    fillRect(rooms, floor, { x: rect.x + col * colW, y: rect.y + row * rowH, w: colW, l: rowH }, `${prefix}-slot${i}`);
  }
  if (fillRow) fillRect(rooms, floor, fillRow, `${prefix}-row`);
  if (fillCol) fillRect(rooms, floor, fillCol, `${prefix}-col`);
}

/** Move whole bedroom+bathroom units from the east zone to the west column when east is overfull. */
function distribute(units: Item[][], eastArea: number, westArea: number, westBase: number) {
  const east = [...units];
  const west: Item[][] = [];
  const pref = (us: Item[][]) => sum(us.flat().map((i) => i.pref));
  while (
    east.length > 1 &&
    pref(east) > eastArea * 1.05 &&
    westBase + pref(west) + pref([east[east.length - 1]]) <= westArea * 1.25
  ) {
    west.unshift(east.pop() as Item[]);
  }
  return { east, west };
}

/** Rough footprint (sq ft) the chosen rooms need, used to keep the house from stretching over a huge plot. */
function idealFootprint(spec: HouseSpec) {
  const two = spec.stories === 2;
  const bed = spec.bedroomSize * spec.bedroomSize;
  const B = spec.bedrooms;
  const BA = spec.bathrooms;
  const v = spec.includeVerandah ? 120 : 0;
  if (!two) {
    return (v + 240 + 130 + 150 + B * bed * 1.05 + BA * 55 + 80) * 1.12;
  }
  const gBeds = B >= 2 ? 1 : 0;
  const gBaths = BA >= 2 ? 1 : gBeds > 0 ? 1 : 0;
  const ground = v + 240 + 130 + 150 + gBeds * bed + gBaths * 55 + 110;
  const upper = 240 + v + (B - gBeds) * bed * 1.1 + (BA - gBaths) * 55 + 110;
  return Math.max(ground, upper) * 1.12;
}

function layoutStories(spec: HouseSpec, env: Rect): Room[] {
  const rooms: Room[] = [];
  const { x: ox, y: oy, w: W, l: L } = env;
  const two = spec.stories === 2;
  const B = spec.bedrooms;
  const BA = spec.bathrooms;
  const bedA = spec.bedroomSize * spec.bedroomSize;

  const gBeds = two ? (B >= 2 ? 1 : 0) : B;
  const uBeds = B - gBeds;
  const gBaths = two ? (BA >= 2 ? 1 : gBeds > 0 ? 1 : 0) : BA;
  const uBaths = BA - gBaths;

  // Unique, human numbering: ground first; the master is unnumbered.
  let bedNo = 0;
  let bathNo = 0;
  const masterUpper = two && uBeds > 0;
  const makeUnits = (nBeds: number, nBaths: number, floor: 0 | 1, hasMaster: boolean): Item[][] => {
    const units: Item[][] = [];
    for (let i = 0; i < Math.max(nBeds, nBaths); i++) {
      const unit: Item[] = [];
      if (i < nBeds) {
        const isMaster = hasMaster && i === 0;
        const num = isMaster ? 0 : ++bedNo;
        unit.push({
          id: isMaster ? "master" : `bed-${num}`,
          name: isMaster ? "Master Bedroom" : `Bedroom ${num}`,
          kind: isMaster ? "master" : "bedroom",
          pref: isMaster ? bedA * 1.2 : bedA,
        });
      }
      if (i < nBaths) {
        const num = ++bathNo;
        unit.push({
          id: `bath-${num}`,
          name: BA > 1 ? `Bathroom ${num}` : "Bathroom",
          kind: "bathroom",
          pref: 55,
        });
      }
      units.push(unit);
    }
    void floor;
    return units;
  };

  const groundUnits = makeUnits(gBeds, gBaths, 0, !masterUpper && gBeds > 0);
  const upperUnits = makeUnits(uBeds, uBaths, 1, masterUpper);

  const frontD = clamp(
    L * (spec.includeVerandah ? 0.3 : 0.36),
    spec.includeVerandah ? 8 : 11,
    Math.min(18, L * 0.42),
  );
  const R = L - frontD;
  const rearY = oy + frontD;

  // ---- front band ----
  const pct = spec.livingRoomWidthPct / 100;
  let verandahW = 0;
  let livingW = W;
  let diningFront = false;
  if (spec.includeVerandah) {
    livingW = clamp(W * pct, Math.min(14, W * 0.4), W - 8);
    verandahW = W - livingW;
    pushRoom(rooms, {
      id: "verandah", name: "Verandah", kind: "verandah", floor: 0,
      x: ox, y: oy, w: verandahW, l: frontD, openSides: ["n"],
    });
    pushRoom(rooms, { id: "living", name: "Living Room", kind: "living", floor: 0, x: ox + verandahW, y: oy, w: livingW, l: frontD });
  } else if (W - clamp(W * pct, 11, W - 10) >= 9) {
    livingW = clamp(W * pct, 11, W - 10);
    diningFront = true;
    pushRoom(rooms, { id: "living", name: "Living Room", kind: "living", floor: 0, x: ox, y: oy, w: livingW, l: frontD });
    pushRoom(rooms, { id: "dining", name: "Dining Room", kind: "dining", floor: 0, x: ox + livingW, y: oy, w: W - livingW, l: frontD });
  } else {
    pushRoom(rooms, { id: "living", name: "Living Room", kind: "living", floor: 0, x: ox, y: oy, w: W, l: frontD });
  }

  // ---- rear band columns ----
  let spineW = spec.includePassage ? clamp(W * 0.09, 3.8, 5) : two ? 4.8 : 0;
  let kitchenW = clamp(W * (spec.kitchenWidthPct / 100), 8.5, W * 0.42);
  if (W - kitchenW - spineW < 10.5) kitchenW = Math.max(6.5, W - spineW - 10.5);
  if (W - kitchenW - spineW < 8) spineW = two ? 3.6 : 0;
  if (W - kitchenW - spineW < 6) kitchenW = Math.max(5, W - spineW - 6);
  const eastW = W - kitchenW - spineW;
  const west: Rect = { x: ox, y: rearY, w: kitchenW, l: R };
  const spine: Rect = { x: ox + kitchenW, y: rearY, w: spineW, l: R };
  const east: Rect = { x: ox + kitchenW + spineW, y: rearY, w: eastW, l: R };

  // ---- spine (passage + stair) ----
  const stairL = clamp(9.5, 7, R * 0.5);
  const spineRoom = (floor: 0 | 1, id: string, name: string, kind: RoomKind, y: number, l: number) =>
    pushRoom(rooms, { id, name, kind, floor, x: spine.x, y, w: spine.w, l });
  if (spineW > 0) {
    for (const floor of two ? ([0, 1] as const) : ([0] as const)) {
      const f = floor;
      const stairId = `stair-${f}`;
      const otherId = f === 0 ? (spec.includePassage ? "passage" : "store-0") : "passage-1";
      const otherName = f === 0 ? (spec.includePassage ? "Passage" : "Store") : "Landing";
      const otherKind: RoomKind = f === 0 && !spec.includePassage ? "store" : "passage";
      if (two && spec.includePassage) {
        spineRoom(f, otherId, otherName, otherKind, spine.y, R - stairL);
        spineRoom(f, stairId, "Stair", "stair", spine.y + R - stairL, stairL);
      } else if (two) {
        spineRoom(f, stairId, "Stair", "stair", spine.y, stairL);
        spineRoom(f, otherId, otherName, otherKind, spine.y + stairL, R - stairL);
      } else {
        spineRoom(0, "passage", "Passage", "passage", spine.y, R);
      }
    }
  }

  // ---- ground: west column + east zone ----
  // West column: kitchen (+ dining when it is not in the front band), then whatever is left.
  const rows: { id: string; name: string; kind: RoomKind; h: number }[] = [
    { id: "kitchen", name: "Kitchen", kind: "kitchen", h: clamp(150 / west.w, 10, 16) },
  ];
  if (!diningFront) rows.push({ id: "dining", name: "Dining Room", kind: "dining", h: clamp(130 / west.w, 9, 14) });
  let usedH = sum(rows.map((r) => r.h));
  if (usedH > R) {
    const k = R / usedH;
    rows.forEach((r) => (r.h *= k));
    usedH = R;
  }
  let leftover = R - usedH;
  if (leftover < 6) {
    rows.forEach((r) => (r.h += leftover / rows.length));
    leftover = 0;
  }
  let cy = west.y;
  for (const r of rows) {
    pushRoom(rooms, { id: r.id, name: r.name, kind: r.kind, floor: 0, x: west.x, y: cy, w: west.w, l: r.h });
    cy += r.h;
  }
  const westRest: Rect = { x: west.x, y: cy, w: west.w, l: leftover };
  const gDist = distribute(groundUnits, east.w * east.l, westRest.w * westRest.l, 0);
  if (leftover > 0) packCell(rooms, 0, westRest, gDist.west, "g-west", spec.bedroomSize);
  packCell(rooms, 0, east, leftover > 0 ? gDist.east : groundUnits, "g-east", spec.bedroomSize);

  // ---- upper floor ----
  if (two) {
    if (spec.includeVerandah) {
      pushRoom(rooms, {
        id: "balcony", name: "Balcony", kind: "balcony", floor: 1,
        x: ox, y: oy, w: verandahW, l: frontD, openSides: ["n"],
      });
      pushRoom(rooms, { id: "hall", name: "Family Lounge", kind: "hall", floor: 1, x: ox + verandahW, y: oy, w: livingW, l: frontD });
    } else {
      pushRoom(rooms, { id: "hall", name: "Family Lounge", kind: "hall", floor: 1, x: ox, y: oy, w: W, l: frontD });
    }
    const uDist = distribute(upperUnits, east.w * east.l, west.w * west.l, 0);
    packCell(rooms, 1, west, uDist.west, "u-west", spec.bedroomSize);
    packCell(rooms, 1, east, uDist.east, "u-east", spec.bedroomSize);
  }

  // Two "Study" rooms on one floor read as a mistake in the plan, so number repeats.
  for (const floor of [0, 1] as const) {
    const byName = new Map<string, Room[]>();
    for (const r of rooms.filter((x) => x.floor === floor)) byName.set(r.name, [...(byName.get(r.name) ?? []), r]);
    for (const [name, list] of byName) if (list.length > 1) list.forEach((r, i) => (r.name = `${name} ${i + 1}`));
  }

  return rooms;
}

// ---------------------------------------------------------------------------------------------
// Walls and openings
//
// Every room side is cut into "pieces" wherever a neighbour starts or stops, so each stretch of
// wall is either exterior or shared with exactly one neighbour. A shared piece becomes ONE wall
// (owned by the lower-index room) and doors/windows are positioned relative to that wall's own
// start. That keeps doors from being buried under a second overlapping wall, and gives elevations
// and the walk-through absolute positions to use.
// ---------------------------------------------------------------------------------------------

const SIDES: WallSide[] = ["n", "s", "e", "w"];
const OPP: Record<WallSide, WallSide> = { n: "s", s: "n", e: "w", w: "e" };

function sideLine(r: Room, s: WallSide) {
  switch (s) {
    case "n": return { horiz: true, coord: r.y, a0: r.x, a1: r.x + r.w };
    case "s": return { horiz: true, coord: r.y + r.l, a0: r.x, a1: r.x + r.w };
    case "w": return { horiz: false, coord: r.x, a0: r.y, a1: r.y + r.l };
    default: return { horiz: false, coord: r.x + r.w, a0: r.y, a1: r.y + r.l };
  }
}

type Piece = {
  room: Room;
  idx: number;
  side: WallSide;
  horiz: boolean;
  coord: number;
  p: number;
  q: number;
  nb: Room | null;
  nbIdx: number;
};

function buildPieces(rooms: Room[]): Piece[] {
  const pieces: Piece[] = [];
  rooms.forEach((room, idx) => {
    for (const side of SIDES) {
      if (room.openSides?.includes(side)) continue;
      const line = sideLine(room, side);
      const nbs: { room: Room; idx: number; a0: number; a1: number }[] = [];
      rooms.forEach((o, j) => {
        if (j === idx || o.floor !== room.floor) return;
        const ol = sideLine(o, OPP[side]);
        if (Math.abs(ol.coord - line.coord) > EPS) return;
        const a0 = Math.max(line.a0, ol.a0);
        const a1 = Math.min(line.a1, ol.a1);
        if (a1 - a0 > 0.05) nbs.push({ room: o, idx: j, a0, a1 });
      });
      const cuts = Array.from(new Set([line.a0, line.a1, ...nbs.flatMap((n) => [n.a0, n.a1])])).sort((a, b) => a - b);
      for (let i = 0; i < cuts.length - 1; i++) {
        const p = cuts[i];
        const q = cuts[i + 1];
        if (q - p < 0.15) continue;
        const mid = (p + q) / 2;
        const nb = nbs.find((n) => mid > n.a0 && mid < n.a1) ?? null;
        pieces.push({ room, idx, side, horiz: line.horiz, coord: line.coord, p, q, nb: nb?.room ?? null, nbIdx: nb?.idx ?? -1 });
      }
    }
  });
  return pieces;
}

function doorAllowed(a: Room, b: Room): boolean {
  const ka = a.kind;
  const kb = b.kind;
  const pair = (x: RoomKind, y: RoomKind) => (ka === x && kb === y) || (ka === y && kb === x);
  const bed = (k: RoomKind) => k === "bedroom" || k === "master";
  if (pair("verandah", "living") || pair("balcony", "hall")) return true;
  if (ka === "stair" || kb === "stair") {
    const o = ka === "stair" ? kb : ka;
    return o === "passage" || o === "hall" || o === "living" || o === "dining";
  }
  if (ka === "passage" || kb === "passage") {
    const o = ka === "passage" ? kb : ka;
    return o !== "verandah" && o !== "balcony";
  }
  if (pair("living", "dining") || pair("living", "kitchen") || pair("dining", "kitchen")) return true;
  if ((bed(ka) && kb === "store" && b.id.endsWith("-dress")) || (bed(kb) && ka === "store" && a.id.endsWith("-dress"))) return true;
  if (pair("living", "study") || pair("kitchen", "store") || pair("hall", "study")) return true;
  if ((bed(ka) && kb === "bathroom") || (bed(kb) && ka === "bathroom")) return true;
  if (ka === "hall" || kb === "hall") {
    const o = ka === "hall" ? kb : ka;
    return bed(o) || o === "bathroom";
  }
  return false;
}

function addOpenings(rooms: Room[], pieces: Piece[]): Map<Piece, Opening[]> {
  const byPiece = new Map<Piece, Opening[]>();
  let n = 0;
  const abs = (pc: Piece, off: number, width: number) => ({
    p1: (pc.horiz ? [pc.p + off, pc.coord] : [pc.coord, pc.p + off]) as [number, number],
    p2: (pc.horiz ? [pc.p + off + width, pc.coord] : [pc.coord, pc.p + off + width]) as [number, number],
  });
  const push = (pc: Piece, o: Omit<Opening, "p1" | "p2" | "roomId" | "wall">) => {
    const opening: Opening = { ...o, roomId: pc.room.id, wall: pc.side, ...abs(pc, o.offset, o.width) };
    byPiece.set(pc, [...(byPiece.get(pc) ?? []), opening]);
  };

  // Interior pieces, one per owned wall, grouped by room pair (longest piece wins).
  const interior = pieces.filter((pc) => pc.nb && pc.idx < pc.nbIdx);
  const best = new Map<string, Piece>();
  for (const pc of interior) {
    const key = [pc.room.id, pc.nb!.id].sort().join("|");
    const cur = best.get(key);
    if (!cur || pc.q - pc.p > cur.q - cur.p) best.set(key, pc);
  }
  const connected = new Map<string, number>();
  const link = (pc: Piece, wide: boolean) => {
    const len = pc.q - pc.p;
    const width = wide ? Math.min(6, len * 0.7) : clamp(len * 0.6, 2.4, 3.2);
    const w = Math.min(width, len - 0.4);
    push(pc, {
      id: uid("door", n++), type: "door", offset: (len - w) / 2, width: w,
      height: wide ? 7.2 : 6.8, sill: 0, connectsTo: pc.nb!.id,
    });
    connected.set(pc.room.id, (connected.get(pc.room.id) ?? 0) + 1);
    connected.set(pc.nb!.id, (connected.get(pc.nb!.id) ?? 0) + 1);
  };
  const isWide = (a: Room, b: Room) => {
    const k = [a.kind, b.kind].sort().join("+");
    return k === "living+verandah" || k === "balcony+hall" || k === "dining+living";
  };
  const isBedBath = (a: Room, b: Room) => {
    const bed = (k: RoomKind) => k === "bedroom" || k === "master";
    return (bed(a.kind) && b.kind === "bathroom") || (bed(b.kind) && a.kind === "bathroom");
  };
  const cands = [...best.values()].filter((pc) => pc.q - pc.p >= 3 && doorAllowed(pc.room, pc.nb!));
  // Bedroom<->bathroom first, so a bathroom that hangs off a bedroom is not also opened to the passage.
  for (const pc of cands.filter((c) => isBedBath(c.room, c.nb!))) link(pc, false);
  for (const pc of cands.filter((c) => !isBedBath(c.room, c.nb!))) {
    const bath = pc.room.kind === "bathroom" ? pc.room : pc.nb!.kind === "bathroom" ? pc.nb! : null;
    if (bath && (connected.get(bath.id) ?? 0) > 0) continue;
    link(pc, isWide(pc.room, pc.nb!));
  }

  // Connectivity: every room must be reachable. Add doors where the plan would otherwise strand a room.
  const adj = new Map<string, Set<string>>();
  for (const list of byPiece.values()) {
    for (const o of list) {
      if (!o.connectsTo || o.connectsTo === "exterior") continue;
      if (!adj.has(o.roomId)) adj.set(o.roomId, new Set());
      if (!adj.has(o.connectsTo)) adj.set(o.connectsTo, new Set());
      adj.get(o.roomId)!.add(o.connectsTo);
      adj.get(o.connectsTo)!.add(o.roomId);
    }
  }
  for (const floor of [0, 1] as const) {
    const fr = rooms.filter((r) => r.floor === floor);
    if (!fr.length) continue;
    const seedIds = floor === 0
      ? fr.filter((r) => r.kind === "living" || r.kind === "verandah").map((r) => r.id)
      : fr.filter((r) => r.kind === "stair" || r.kind === "passage").map((r) => r.id);
    const reached = new Set<string>(seedIds.length ? seedIds : [fr[0].id]);
    const grow = () => {
      let changed = true;
      while (changed) {
        changed = false;
        for (const id of [...reached]) {
          for (const nb of adj.get(id) ?? []) {
            if (!reached.has(nb)) { reached.add(nb); changed = true; }
          }
        }
      }
    };
    grow();
    for (let guard = 0; guard < 40; guard++) {
      const stranded = fr.filter((r) => !reached.has(r.id));
      if (!stranded.length) break;
      let pick: Piece | null = null;
      for (const pc of interior) {
        if (pc.room.floor !== floor) continue;
        const a = reached.has(pc.room.id);
        const b = reached.has(pc.nb!.id);
        if (a === b) continue;
        if (pc.q - pc.p < 2.4) continue;
        if (!pick || pc.q - pc.p > pick.q - pick.p) pick = pc;
      }
      if (!pick) break;
      link(pick, false);
      const a = pick.room.id;
      const b = pick.nb!.id;
      if (!adj.has(a)) adj.set(a, new Set());
      if (!adj.has(b)) adj.set(b, new Set());
      adj.get(a)!.add(b);
      adj.get(b)!.add(a);
      reached.add(a);
      reached.add(b);
      grow();
    }
  }

  // Front door (only when there is no verandah: the verandah opening is the way in).
  const exteriorPieces = pieces.filter((pc) => !pc.nb);
  const hasVerandah = rooms.some((r) => r.kind === "verandah");
  const entryRoom = rooms.find((r) => r.kind === "living" && r.floor === 0);
  let entryPiece: Piece | null = null;
  if (!hasVerandah && entryRoom) {
    entryPiece = exteriorPieces
      .filter((pc) => pc.room.id === entryRoom.id && pc.side === "n")
      .sort((a, b) => b.q - b.p - (a.q - a.p))[0] ?? null;
    if (entryPiece) {
      const len = entryPiece.q - entryPiece.p;
      const w = Math.min(3.6, len - 1);
      push(entryPiece, { id: "entry-door", type: "door", offset: (len - w) / 2, width: w, height: 7, sill: 0, connectsTo: "exterior" });
    }
  }

  // Windows on exterior pieces.
  for (const pc of exteriorPieces) {
    if (pc === entryPiece) continue;
    const k = pc.room.kind;
    if (k === "stair" || k === "passage" || k === "store") continue;
    const len = pc.q - pc.p;
    if (len < 4.2) continue;
    const isBath = k === "bathroom";
    const width = isBath ? Math.min(3, len * 0.5) : clamp(len * 0.34, 3.2, 6);
    const count = !isBath && len > 15 ? 2 : 1;
    for (let i = 0; i < count; i++) {
      const centre = (len * (i + 1)) / (count + 1);
      push(pc, {
        id: uid("win", n++), type: "window", offset: centre - width / 2, width,
        height: isBath ? 2.4 : 4.2, sill: isBath ? 4.2 : 3, connectsTo: "exterior",
      });
    }
  }
  return byPiece;
}

function buildWalls(pieces: Piece[], byPiece: Map<Piece, Opening[]>): { walls: WallSeg[]; openings: Opening[] } {
  const walls: WallSeg[] = [];
  const openings: Opening[] = [];
  let n = 0;
  for (const pc of pieces) {
    if (pc.nb && pc.idx > pc.nbIdx) continue; // the neighbour owns this shared wall
    const id = uid("wall", n++);
    const ops = (byPiece.get(pc) ?? []).map((o) => ({ ...o, wallId: id }));
    walls.push({
      id,
      floor: pc.room.floor,
      x1: pc.horiz ? pc.p : pc.coord,
      y1: pc.horiz ? pc.coord : pc.p,
      x2: pc.horiz ? pc.q : pc.coord,
      y2: pc.horiz ? pc.coord : pc.q,
      interior: Boolean(pc.nb),
      roomId: pc.room.id,
      side: pc.side,
      openings: ops,
    });
    openings.push(...ops);
  }
  return { walls, openings };
}

export function buildHouse(input: HouseSpec): HouseModel {
  const spec = normalizeSpec(input);
  const plot = { w: spec.plotWidth, l: spec.plotLength };
  const setback = clamp(Math.min(plot.w, plot.l) * 0.08, 3, 5);
  let envelope = {
    x: setback,
    y: setback,
    w: round1(plot.w - setback * 2),
    l: round1(plot.l - setback * 2),
  };
  // On a plot much bigger than the chosen rooms need, keep the house a sensible size and centred
  // (the rest is garden) instead of stretching rooms into ballrooms.
  const cap = idealFootprint(spec) * 1.5;
  const avail = envelope.w * envelope.l;
  if (avail > cap) {
    const k = Math.sqrt(cap / avail);
    const w = round1(Math.max(Math.min(envelope.w, 22), envelope.w * k));
    const l = round1(Math.max(Math.min(envelope.l, 28), envelope.l * k));
    envelope = { x: round1((plot.w - w) / 2), y: round1((plot.l - l) / 2), w, l };
  }
  const rooms = layoutStories(spec, envelope);
  const pieces = buildPieces(rooms);
  const { walls, openings } = buildWalls(pieces, addOpenings(rooms, pieces));
  return {
    spec,
    rooms,
    openings,
    walls,
    envelope,
    plot,
    stories: spec.stories,
    wallT: spec.wallThickness / 12,
    floorH: spec.floorHeight,
    plinthH: 1.35,
    slabT: 0.5,
  };
}

export function roomArea(room: Room) {
  return room.w * room.l;
}

export function floorLevel(model: HouseModel, floor: 0 | 1) {
  if (floor === 0) return model.plinthH;
  return model.plinthH + model.floorH + model.slabT;
}

export function buildingHeight(model: HouseModel) {
  const top = floorLevel(model, model.stories === 2 ? 1 : 0) + model.floorH;
  return top;
}

export function roomsOnFloor(model: HouseModel, floor: 0 | 1) {
  return model.rooms.filter((r) => r.floor === floor);
}

export function walkableRooms(model: HouseModel) {
  return model.rooms.filter((r) => r.kind !== "stair");
}
