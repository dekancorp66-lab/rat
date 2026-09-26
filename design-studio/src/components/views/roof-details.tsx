import { roofFaces } from "@/lib/house/roof";
import { computeRoofArea, roofPitchDeg, roofRise } from "@/lib/house/quantities";
import type { HouseModel } from "@/lib/house/types";

export function RoofDetailsView({ model }: { model: HouseModel }) {
  const faces = roofFaces(model);
  const area = computeRoofArea(model);
  const pitch = roofPitchDeg(model.spec.roofStyle);
  const rise = roofRise(model);
  const span = Math.min(model.envelope.w, model.envelope.l);
  const pad = 4;
  const w = model.envelope.w + pad * 2;
  const l = model.envelope.l + pad * 2;

  return (
    <div className="grid h-full min-h-0 gap-6 overflow-hidden lg:grid-cols-[1.2fr_0.8fr]">
      <div className="rounded-[28px] bg-surface p-6 shadow-sm">
        <h2 className="font-display text-2xl">Roof plan</h2>
        <p className="mt-1 text-sm text-muted">
          {model.spec.roofStyle} · {pitch}° pitch · {rise.toFixed(1)} ft rise
        </p>
        <svg viewBox={`${-w / 2} ${-l / 2} ${w} ${l}`} className="mt-4 h-[52vh] w-full">
          <rect x={-w / 2} y={-l / 2} width={w} height={l} fill="#fffcf7" />
          {faces.map((f, i) => {
            const pts = f.points.map((p) => `${p[0]},${p[2]}`).join(" ");
            const hues = ["#c24e32", "#d26544", "#b5442c", "#a83b28"];
            return (
              <g key={f.id}>
                <polygon points={pts} fill={hues[i % hues.length]} fillOpacity={0.85} stroke="#6b2418" strokeWidth={0.12} />
                <text
                  x={f.points.reduce((s, p) => s + p[0], 0) / f.points.length}
                  y={f.points.reduce((s, p) => s + p[2], 0) / f.points.length}
                  textAnchor="middle"
                  fontSize={1.1}
                  fill="#fffaf6"
                  fontFamily="Outfit, sans-serif"
                >
                  {f.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="rounded-[28px] bg-surface p-6 shadow-sm min-h-0 overflow-y-auto">
        <h3 className="text-sm font-medium tracking-[0.14em] text-muted uppercase">Geometry</h3>
        <dl className="mt-4 space-y-3 text-sm">
          <Row k="Style" v={model.spec.roofStyle} />
          <Row k="Pitch" v={`${pitch}°`} />
          <Row k="Rise" v={`${rise.toFixed(1)} ft`} />
          <Row k="Span" v={`${span.toFixed(1)} ft`} />
          <Row k="Overhang" v="1.6 ft" />
          <Row k="Total area" v={`${Math.round(area)} sq ft`} />
        </dl>
        <h3 className="mt-8 text-sm font-medium tracking-[0.14em] text-muted uppercase">Planes</h3>
        <ul className="mt-3 space-y-2">
          {faces.map((f) => (
            <li key={f.id} className="flex justify-between text-sm">
              <span>{f.name}</span>
              <span className="tabular-nums text-muted">{Math.round(f.area)} sq ft</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between border-b border-border pb-2">
      <dt className="text-muted">{k}</dt>
      <dd className="capitalize tabular-nums">{v}</dd>
    </div>
  );
}
