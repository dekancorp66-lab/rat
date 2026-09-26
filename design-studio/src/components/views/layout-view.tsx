import {
  ArrowLeftRight,
  ArrowUpDown,
  Archive,
  Bath,
  BedDouble,
  BedSingle,
  BookOpen,
  ChefHat,
  DoorOpen,
  LayoutGrid,
  Sofa,
  Trees,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { roomArea, roomsOnFloor } from "@/lib/house/layout";
import type { Room, RoomKind } from "@/lib/house/types";
import type { HouseModel } from "@/lib/house/types";
import { cn } from "@/lib/utils";

const ROOM_ICONS: Record<RoomKind, LucideIcon> = {
  verandah: DoorOpen,
  living: Sofa,
  kitchen: ChefHat,
  dining: UtensilsCrossed,
  passage: ArrowUpDown,
  bedroom: BedDouble,
  master: BedDouble,
  bathroom: Bath,
  stair: ArrowUpDown,
  balcony: Trees,
  store: Archive,
  hall: LayoutGrid,
  study: BookOpen,
};

// Soft, cohesive palette keyed by room type — tinted fills + a matching
// darker accent used for the room's border and label so the plan reads as
// a proper color-coded architectural drawing rather than flat beige boxes.
const ROOM_COLORS: Record<RoomKind, { fill: string; accent: string }> = {
  verandah: { fill: "#f1e6d2", accent: "#a9834a" },
  living: { fill: "#f5ddc8", accent: "#c17a3e" },
  kitchen: { fill: "#d9e8dc", accent: "#5f8f6c" },
  dining: { fill: "#f2e6b8", accent: "#b5942c" },
  passage: { fill: "#ede8de", accent: "#9a9184" },
  bedroom: { fill: "#dde3f2", accent: "#5d6fa8" },
  master: { fill: "#d7e0f4", accent: "#4c60a3" },
  bathroom: { fill: "#d6ecef", accent: "#3f8a95" },
  stair: { fill: "#ece7de", accent: "#8a8172" },
  balcony: { fill: "#dcefe2", accent: "#4f9468" },
  store: { fill: "#e7e0d2", accent: "#8f7c54" },
  hall: { fill: "#eae3d4", accent: "#a08d5f" },
  study: { fill: "#e6dcee", accent: "#7d5ba6" },
};

function RoomIcon({ kind, className }: { kind?: RoomKind; className?: string }) {
  const Icon = (kind && ROOM_ICONS[kind]) ?? BedSingle;
  return <Icon className={className} />;
}

export function LayoutView({
  model,
  floor,
  onFloor,
}: {
  model: HouseModel;
  floor: 0 | 1;
  onFloor: (f: 0 | 1) => void;
}) {
  const rooms = roomsOnFloor(model, floor);
  const roomById = (id: string) => rooms.find((r) => r.id === id);

  const links: [string, string][] = [];
  for (const o of model.openings) {
    if (o.type !== "door" || !o.connectsTo || o.connectsTo === "exterior") continue;
    const a = o.roomId;
    const b = o.connectsTo;
    if (rooms.some((r) => r.id === a) && rooms.some((r) => r.id === b)) {
      const key = [a, b].sort().join("|");
      if (!links.some((l) => l.join("|") === key)) links.push([a, b]);
    }
  }

  // Show direct room-to-room connections first; de-emphasize passage-mediated
  // links further down so the meaningful adjacencies aren't buried.
  const isPassageLink = ([a, b]: [string, string]) =>
    roomById(a)?.kind === "passage" || roomById(b)?.kind === "passage";
  const sortedLinks = [...links].sort((x, y) => Number(isPassageLink(x)) - Number(isPassageLink(y)));

  const env = model.envelope;
  const dimGap = 3.2;
  const pad = 6;

  return (
    <div className="grid h-full min-h-0 gap-6 overflow-hidden lg:grid-cols-[1.35fr_0.65fr]">
      <div className="flex min-h-0 flex-col rounded-[28px] bg-surface p-6 shadow-md">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl">Dimensioned layout</h2>
            <p className="mt-1 text-sm text-muted">Wall centre-lines, rooms abut — no overlapping walls.</p>
          </div>
          {model.stories === 2 && (
            <div className="flex rounded-full bg-chip p-1 text-sm">
              <button
                type="button"
                className={`rounded-full px-3 py-1.5 ${floor === 0 ? "bg-surface font-medium shadow-sm" : "text-muted"}`}
                onClick={() => onFloor(0)}
              >
                Ground
              </button>
              <button
                type="button"
                className={`rounded-full px-3 py-1.5 ${floor === 1 ? "bg-surface font-medium shadow-sm" : "text-muted"}`}
                onClick={() => onFloor(1)}
              >
                First
              </button>
            </div>
          )}
        </div>

        {/* "Blueprint sheet" frame — a distinct paper surface, fine grid and
           border so the drawing reads as a real technical plan rather than
           floating shapes on the card background. min-h-0 + overflow-y-auto
           here is what lets the sheet scroll instead of clipping the bottom
           rows when the drawing is taller than the space available. */}
        <div className="mt-4 min-h-0 flex-1 overflow-y-auto rounded-2xl border border-border/70 bg-[#fffdf9] p-3 shadow-inner">
          <svg
            viewBox={`${env.x - pad} ${env.y - pad} ${env.w + pad * 2} ${env.l + pad * 2}`}
            className="h-[68vh] min-h-[520px] w-full"
            preserveAspectRatio="xMidYMin meet"
          >
            <defs>
              <pattern id="plan-grid" width={2} height={2} patternUnits="userSpaceOnUse">
                <path d="M 2 0 L 0 0 0 2" fill="none" stroke="#eee6d8" strokeWidth={0.04} />
              </pattern>
              <filter id="room-shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="0.15" stdDeviation="0.18" floodColor="#1f1a16" floodOpacity="0.18" />
              </filter>
            </defs>

            <rect
              x={env.x - pad}
              y={env.y - pad}
              width={env.w + pad * 2}
              height={env.l + pad * 2}
              fill="url(#plan-grid)"
            />

            <rect
              x={env.x}
              y={env.y}
              width={env.w}
              height={env.l}
              fill="none"
              stroke="#e07045"
              strokeDasharray="0.7 0.4"
              strokeWidth={0.14}
            />

            {rooms.map((r: Room) => {
              const c = ROOM_COLORS[r.kind] ?? { fill: "#f7f1e8", accent: "#1f1a16" };
              const clipId = `room-clip-${r.id}`;
              // Narrow rooms (landings, thin passages) can't fit both lines
              // without spilling into the neighbouring room — drop the
              // dimension sub-label and shrink the name for those instead of
              // letting text bleed outside the room's own rect.
              const isNarrow = r.w < 5 || r.l < 5;
              const nameSize = isNarrow ? 0.8 : 1.15;
              return (
                <g key={r.id} filter="url(#room-shadow)">
                  <clipPath id={clipId}>
                    <rect x={r.x + 0.15} y={r.y + 0.15} width={Math.max(r.w - 0.3, 0)} height={Math.max(r.l - 0.3, 0)} />
                  </clipPath>
                  <rect
                    x={r.x}
                    y={r.y}
                    width={r.w}
                    height={r.l}
                    rx={0.25}
                    fill={c.fill}
                    stroke={c.accent}
                    strokeWidth={0.16}
                  />
                  <g clipPath={`url(#${clipId})`}>
                    <text
                      x={r.x + r.w / 2}
                      y={r.y + r.l / 2}
                      textAnchor="middle"
                      fontSize={nameSize}
                      fontWeight={600}
                      fill="#231d17"
                      fontFamily="Outfit, sans-serif"
                    >
                      {r.name}
                    </text>
                    {!isNarrow && (
                      <text
                        x={r.x + r.w / 2}
                        y={r.y + r.l / 2 + 1.5}
                        textAnchor="middle"
                        fontSize={0.75}
                        fill={c.accent}
                        fontFamily="Outfit, sans-serif"
                      >
                        {r.w.toFixed(1)} × {r.l.toFixed(1)} ft
                      </text>
                    )}
                  </g>
                </g>
              );
            })}

            {/* Overall width dimension, drawn with end ticks like a real dim line */}
            <g stroke="#e07045" strokeWidth={0.08}>
              <line x1={env.x} y1={env.y - dimGap} x2={env.x + env.w} y2={env.y - dimGap} />
              <line x1={env.x} y1={env.y - dimGap - 0.5} x2={env.x} y2={env.y - dimGap + 0.5} />
              <line
                x1={env.x + env.w}
                y1={env.y - dimGap - 0.5}
                x2={env.x + env.w}
                y2={env.y - dimGap + 0.5}
              />
            </g>
            <text
              x={env.x + env.w / 2}
              y={env.y - dimGap - 0.6}
              textAnchor="middle"
              fontSize={1}
              fontWeight={600}
              fill="#e07045"
              fontFamily="Outfit, sans-serif"
            >
              {env.w.toFixed(1)} ft
            </text>

            {/* Overall length dimension */}
            <g stroke="#e07045" strokeWidth={0.08}>
              <line x1={env.x - dimGap} y1={env.y} x2={env.x - dimGap} y2={env.y + env.l} />
              <line x1={env.x - dimGap - 0.5} y1={env.y} x2={env.x - dimGap + 0.5} y2={env.y} />
              <line
                x1={env.x - dimGap - 0.5}
                y1={env.y + env.l}
                x2={env.x - dimGap + 0.5}
                y2={env.y + env.l}
              />
            </g>
            <text
              x={env.x - dimGap - 0.7}
              y={env.y + env.l / 2}
              textAnchor="middle"
              fontSize={1}
              fontWeight={600}
              fill="#e07045"
              fontFamily="Outfit, sans-serif"
              transform={`rotate(-90 ${env.x - dimGap - 0.7} ${env.y + env.l / 2})`}
            >
              {env.l.toFixed(1)} ft
            </text>

            {/* North arrow — small compass flourish that reads as a real plan sheet */}
            <g transform={`translate(${env.x + env.w + pad - 2.2} ${env.y + pad - 2.2})`}>
              <circle r={1.6} fill="#fffdf9" stroke="#c9bfa8" strokeWidth={0.08} />
              <path d="M 0 -1.2 L 0.5 0.6 L 0 0.2 L -0.5 0.6 Z" fill="#e07045" />
              <text y={2.3} textAnchor="middle" fontSize={0.6} fill="#8a8172" fontFamily="Outfit, sans-serif">
                N
              </text>
            </g>
          </svg>
        </div>
      </div>

      {/* min-h-0 + overflow-y-auto is what makes this panel scroll instead of
         clipping "Areas" off the bottom when the room/adjacency list is long. */}
      <div className="min-h-0 overflow-y-auto rounded-[28px] bg-surface p-6 shadow-md">
        <h3 className="text-sm font-medium tracking-[0.14em] text-muted uppercase">Adjacency</h3>
        <ul className="mt-4 space-y-2 text-sm">
          {sortedLinks.length === 0 && <li className="text-muted">No interior doors on this floor.</li>}
          {sortedLinks.map(([a, b]) => {
            const ra = roomById(a);
            const rb = roomById(b);
            const muted = isPassageLink([a, b]);
            return (
              <li
                key={`${a}-${b}`}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 transition-colors",
                  muted ? "bg-chip/50 text-muted" : "bg-chip",
                )}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <RoomIcon kind={ra?.kind} className="size-3.5 shrink-0" />
                  <span className="truncate">{ra?.name}</span>
                </span>
                <ArrowLeftRight className={cn("size-3.5 shrink-0", muted ? "text-muted" : "text-primary")} />
                <span className="flex min-w-0 items-center justify-end gap-2 text-right">
                  <span className="truncate">{rb?.name}</span>
                  <RoomIcon kind={rb?.kind} className="size-3.5 shrink-0" />
                </span>
              </li>
            );
          })}
        </ul>

        <div className="mt-8 border-t border-border pt-6">
          <h3 className="text-sm font-medium tracking-[0.14em] text-muted uppercase">Areas</h3>
          <ul className="mt-3">
            {rooms.map((r: Room) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-3 border-b border-border/60 py-2.5 text-sm last:border-b-0"
              >
                <span className="flex items-center gap-2">
                  <RoomIcon kind={r.kind} className="size-3.5 text-muted" />
                  {r.name}
                </span>
                <span className="tabular-nums text-muted">{Math.round(roomArea(r))} sq ft</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}