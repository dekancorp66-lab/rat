import { estimateHouse, formatMoney } from "@/lib/house/quantities";
import { downloadText, estimateCsv } from "@/lib/house/export";
import type { HouseSpec } from "@/lib/house/types";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

const GROUP: Record<string, string> = {
  roof: "Roof",
  structure: "Structure",
  openings: "Openings",
  finishes: "Finishes",
};

export function QuantitiesView({ spec }: { spec: HouseSpec }) {
  const est = estimateHouse(spec);
  const groups = ["roof", "structure", "openings", "finishes"] as const;
  return (
    // h-full min-h-0 + overflow-y-auto is what lets this card scroll instead
    // of being clipped by the parent viewport's overflow-hidden once the
    // line items run past the visible height.
    <div className="mx-auto h-full min-h-0 max-w-3xl overflow-y-auto rounded-[28px] bg-surface p-6 shadow-sm md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl">Bill of quantities</h2>
          <p className="mt-1 text-sm text-muted">Live takeoff from the current configuration.</p>
        </div>
        <Button
          variant="secondary"
          onClick={() => downloadText(`${spec.name.replace(/\s+/g, "-").toLowerCase()}-bom.csv`, estimateCsv(spec), "text/csv")}
        >
          <Download /> Export CSV
        </Button>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Stat label="Floor area" value={`${Math.round(est.floorArea)} sq ft`} />
        <Stat label="Roof area" value={`${Math.round(est.roofArea)} sq ft`} />
        <Stat label="Footprint" value={`${Math.round(est.footprint)} sq ft`} />
      </div>
      {groups.map((g) => (
        <section key={g} className="mt-8">
          <h3 className="text-xs tracking-[0.16em] text-muted uppercase">{GROUP[g]}</h3>
          <ul className="mt-2 divide-y divide-border">
            {est.items
              .filter((i) => i.group === g)
              .map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                  <span>
                    <span className="block font-medium">{i.label}</span>
                    <span className="text-xs text-muted">{i.detail}</span>
                  </span>
                  <span className="tabular-nums">{formatMoney(i.total)}</span>
                </li>
              ))}
          </ul>
        </section>
      ))}
      <div className="mt-8 flex items-center justify-between rounded-[18px] bg-chip px-5 py-4">
        <span>Estimated material cost</span>
        <span className="font-display text-2xl text-primary tabular-nums">{formatMoney(est.materialCost)}</span>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] bg-chip px-4 py-3">
      <p className="text-[11px] tracking-wide text-muted uppercase">{label}</p>
      <p className="mt-1 text-lg tabular-nums">{value}</p>
    </div>
  );
}