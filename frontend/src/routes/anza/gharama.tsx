import { createFileRoute, Link } from "@tanstack/react-router";
import { BriefForm } from "@/components/app/brief-form";
import { PageHead } from "@/components/app/page-head";
import { Button } from "@/components/ui/button";
import { computeEstimate } from "@/lib/construction/estimate";
import { REGIONS } from "@/lib/construction/data";
import { formatRange, formatTsh } from "@/lib/format";
import { seedBrief, useJenga } from "@/lib/store";

export const Route = createFileRoute("/anza/gharama")({ component: GharamaPage });

function GharamaPage() {
  const project = useJenga((s) => s.project);
  const upsert = useJenga((s) => s.upsertProjectFromBrief);
  const brief = project?.brief ?? seedBrief;
  const estimate = computeEstimate(brief);
  const region = REGIONS.find((r) => r.id === brief.region);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHead
        title="Kikokotoo cha Gharama"
        lede="Makadirio yanatumia bei za sasa za mikoa ya Tanzania. Badilisha mkoa, eneo na finishes kuona range."
      />
      <div className="rounded-3xl border border-border bg-surface p-5 shadow-[var(--shadow-card)] md:p-6">
        <BriefForm brief={brief} onChange={(b) => upsert(b)} />
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Stat label="Makadirio" value={formatRange(estimate.costLow, estimate.costHigh)} />
        <Stat label="Wastani" value={formatTsh(estimate.costMid, true)} />
        <Stat label="Muda" value={`Miezi ${estimate.monthsLow}–${estimate.monthsHigh}`} />
      </div>
      {region ? <p className="mt-3 text-xs text-subtle">{region.note}</p> : null}
      <div className="mt-8 overflow-hidden rounded-3xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead className="bg-bg-warm text-left text-xs tracking-wide text-muted uppercase">
            <tr>
              <th className="px-4 py-3 font-medium">Hatua</th>
              <th className="px-4 py-3 font-medium">Wiki</th>
              <th className="px-4 py-3 font-medium">Gharama</th>
            </tr>
          </thead>
          <tbody>
            {estimate.phases.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="px-4 py-3">{p.title}</td>
                <td className="px-4 py-3 tabular-nums">{p.weeks}</td>
                <td className="px-4 py-3 tabular-nums">{formatTsh(p.cost, true)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild>
          <Link to="/anza/vifaa">Ona vifaa</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/anza/mradi">Fungua meneja wa mradi</Link>
        </Button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-border bg-surface p-5">
      <p className="text-xs font-medium tracking-wide text-muted uppercase">{label}</p>
      <p className="mt-2 font-display text-2xl font-medium tabular-nums">{value}</p>
    </div>
  );
}
