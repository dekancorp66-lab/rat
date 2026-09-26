import { formatRange } from "@/lib/format";
import type { Estimate } from "@/lib/construction/estimate";
import { REGIONS } from "@/lib/construction/data";

export function EstimateCard({ estimate }: { estimate: Estimate }) {
  const region = REGIONS.find((r) => r.id === estimate.brief.region)?.name;
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface text-sm">
      <div className="grid grid-cols-2 gap-px bg-border">
        <div className="bg-primary-soft px-4 py-3">
          <p className="text-[10px] font-semibold tracking-wider text-primary uppercase">
            Makadirio ya gharama
          </p>
          <p className="mt-1 font-display text-lg font-semibold text-fg tabular-nums">
            {formatRange(estimate.costLow, estimate.costHigh)}
          </p>
        </div>
        <div className="bg-bg-warm px-4 py-3">
          <p className="text-[10px] font-semibold tracking-wider text-muted uppercase">
            Muda wa ujenzi
          </p>
          <p className="mt-1 font-display text-lg font-semibold text-fg tabular-nums">
            Miezi {estimate.monthsLow} – {estimate.monthsHigh}
          </p>
        </div>
      </div>
      <div className="px-4 py-3">
        <p className="text-xs font-semibold text-fg">Vifaa muhimu vinavyohitajika</p>
        <ul className="mt-2 space-y-1 text-xs text-muted">
          {estimate.materials.slice(0, 5).map((m) => (
            <li key={m.key}>
              {m.name}: {m.low} – {m.high} {m.unit}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs font-semibold text-fg">Hatua za ujenzi</p>
        <ol className="mt-1 space-y-0.5 text-xs text-muted">
          {estimate.phases.map((p, i) => (
            <li key={p.id}>
              {i + 1}. {p.title}
            </li>
          ))}
        </ol>
        {region ? (
          <p className="mt-3 text-[11px] text-subtle">
            Wastani wa {estimate.brief.areaSqm} m² · {region}
          </p>
        ) : null}
      </div>
    </div>
  );
}
