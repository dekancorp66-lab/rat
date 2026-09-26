import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { BriefForm } from "@/components/app/brief-form";
import { PageHead } from "@/components/app/page-head";
import { Button } from "@/components/ui/button";
import { computeEstimate } from "@/lib/construction/estimate";
import { formatTsh } from "@/lib/format";
import { seedBrief, useJenga } from "@/lib/store";

export const Route = createFileRoute("/anza/vifaa")({ component: VifaaPage });

function VifaaPage() {
  const project = useJenga((s) => s.project);
  const upsert = useJenga((s) => s.upsertProjectFromBrief);
  const load = useJenga((s) => s.loadMaterialsIntoCart);
  const brief = project?.brief ?? seedBrief;
  const estimate = computeEstimate(brief);
  const total = estimate.materials.reduce(
    (n, m) => n + Math.round(((m.low + m.high) / 2) * m.unitPrice),
    0,
  );

  return (
    <div className="mx-auto max-w-4xl">
      <PageHead
        title="Kikokotoo cha Vifaa"
        lede="Hesabu mfuko wa saruji, nondo, mchanga, kokoto, bati na matofali kulingana na eneo la nyumba."
      />
      <div className="rounded-3xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
        <BriefForm brief={brief} onChange={(b) => upsert(b)} />
      </div>
      <div className="mt-6 overflow-x-auto rounded-3xl border border-border bg-surface">
        <table className="w-full min-w-[32rem] text-sm">
          <thead className="bg-bg-warm text-left text-xs tracking-wide text-muted uppercase">
            <tr>
              <th className="px-4 py-3 font-medium">Kifaa</th>
              <th className="px-4 py-3 font-medium">Kiasi</th>
              <th className="px-4 py-3 font-medium">Bei ya mwongozo</th>
            </tr>
          </thead>
          <tbody>
            {estimate.materials.map((m) => (
              <tr key={m.key} className="border-t border-border">
                <td className="px-4 py-3">{m.name}</td>
                <td className="px-4 py-3 tabular-nums">
                  {m.low} – {m.high} {m.unit}
                </td>
                <td className="px-4 py-3 tabular-nums">
                  {formatTsh(Math.round(((m.low + m.high) / 2) * m.unitPrice), true)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-sm text-muted">
        Jumla ya vifaa (mwongozo):{" "}
        <span className="font-semibold text-fg tabular-nums">{formatTsh(total, true)}</span>
        . Hii si pamoja na fundi.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button
          onClick={() => {
            load(estimate);
            toast.success("Vifaa vimeongezwa kwenye kikapu.");
          }}
        >
          Ongeza kwenye kikapu
        </Button>
        <Button asChild variant="outline">
          <Link to="/anza/agiza">Nenda kuagiza</Link>
        </Button>
      </div>
    </div>
  );
}
