import { createFileRoute, Link } from "@tanstack/react-router";
import { BriefForm } from "@/components/app/brief-form";
import { PageHead } from "@/components/app/page-head";
import { Button } from "@/components/ui/button";
import { REGIONS } from "@/lib/construction/data";
import { computeEstimate, describeBrief } from "@/lib/construction/estimate";
import { formatRange } from "@/lib/format";
import { seedBrief, useJenga } from "@/lib/store";

export const Route = createFileRoute("/anza/mshauri")({ component: MshauriPage });

function MshauriPage() {
  const project = useJenga((s) => s.project);
  const upsert = useJenga((s) => s.upsertProjectFromBrief);
  const brief = project?.brief ?? seedBrief;
  const estimate = computeEstimate(brief);
  const region = REGIONS.find((r) => r.id === brief.region);

  const tips = [
    brief.storeys > 1
      ? "Ghorofa mbili zinahitaji mhandisi wa miundo na ring beam kila ghorofa — usijenge kwa fundi peke yake."
      : "Ghorofa moja ni nafuu kudumisha. Weka veranda upande wa magharibi kupunguza joto la jioni.",
    brief.region === "dar" || brief.region === "zanzibar"
      ? "Pwani: tumia nondo zenye cover ya kutosha na rangi ya nje inayostahimili chumvi."
      : "Nyanda za ndani: hakikisha mteremko wa paa unatosha kwa mvua za masika.",
    brief.bedrooms >= 4
      ? "Nyumba kubwa: tengeneza kanda mbili (family vs. guest) ili kupunguza gharama za AC na umeme."
      : "Weka master bedroom upande wa mashariki — mwanga wa asubuhi, baridi ya usiku.",
    "Mwelekeo: sebuleni na veranda zielekee upepo wa kaskazini-mashariki pale inapowezekana.",
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <PageHead
        title="Mshauri wa Ujenzi"
        lede="Panga muundo, idadi ya vyumba na mwelekeo kulingana na eneo. Bajeti inasasishwa mara moja."
      />
      <div className="rounded-3xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
        <BriefForm brief={brief} onChange={(b) => upsert(b)} />
      </div>
      <p className="mt-4 text-sm text-muted">{describeBrief(brief)}</p>
      <p className="mt-1 font-display text-2xl font-medium tabular-nums">
        {formatRange(estimate.costLow, estimate.costHigh)}
      </p>
      {region ? <p className="mt-1 text-xs text-subtle">{region.note}</p> : null}
      <ul className="mt-6 space-y-3">
        {tips.map((t) => (
          <li key={t} className="rounded-3xl border border-border bg-surface p-5 text-sm leading-relaxed">
            {t}
          </li>
        ))}
      </ul>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild>
          <Link to="/anza">Uliza JengaAI</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/anza/design">Fungua Design</Link>
        </Button>
      </div>
    </div>
  );
}
