import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHead } from "@/components/app/page-head";
import { BUILD_PHASES } from "@/lib/construction/data";
import { cn } from "@/lib/cn";

const TIPS: Record<string, string[]> = {
  site: [
    "Pima kiwanja mara mbili kabla ya kuchimba — kosa la 20 cm linagharimu kuta nzima.",
    "Kina cha msingi: angalau 600–900 mm kwenye udongo wa kawaida; zaidi kwenye black cotton.",
    "Usikumwage concrete kama mvua inanyesha au formwork ina maji.",
    "Nondo za msingi ziwe safi, zimefungwa na spacer — si chini ya udongo.",
  ],
  walls: [
    "Anza kuta baada ya msingi kukauka angalau siku 3–7.",
    "Kila mita 3 weka vertical reinforcement kwenye pembe.",
    "Window sills ziwe sawa; angalia spirit level kila kozi 4 za matofali.",
    "Ring beam ni lazima kabla ya paa au slab — usiruke.",
  ],
  roof: [
    "Trusses ziwe treated dhidi ya termites.",
    "Overlap ya bati angalau 150 mm; screws si nails kwenye G28.",
    "Weka valley flashings kabla ya bati, si baada.",
    "Fascia na gutter zipunguze maji yasichuruzike kuta.",
  ],
  finish: [
    "Plumbing pressure-test kabla ya kufunga tiles.",
    "Wiring iwe katika conduit, si moja kwa moja kwenye plaster.",
    "Rangi baada ya plaster kukauka kabisa (siku 7+).",
    "Septic tank iwe chini ya mteremko, mbali na kisima.",
  ],
};

export const Route = createFileRoute("/anza/engineer")({ component: EngineerPage });

function EngineerPage() {
  const [id, setId] = useState(BUILD_PHASES[0].id);
  const phase = BUILD_PHASES.find((p) => p.id === id) ?? BUILD_PHASES[0];

  return (
    <div className="mx-auto max-w-3xl">
      <PageHead
        title="Site Engineer AI"
        lede="Ushauri wa tovuti: msingi, kuta, jamvi, nondo za beam na slab. Chagua hatua unayofanya sasa."
      />
      <div className="flex flex-wrap gap-2">
        {BUILD_PHASES.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setId(p.id)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium",
              p.id === id ? "bg-primary text-primary-fg" : "bg-surface text-muted border border-border",
            )}
          >
            {p.title}
          </button>
        ))}
      </div>
      <ol className="mt-6 space-y-3">
        {(TIPS[phase.id] ?? []).map((t, i) => (
          <li key={i} className="rounded-3xl border border-border bg-surface p-5 text-sm leading-relaxed">
            <span className="mr-2 font-display text-lg text-primary">{String(i + 1).padStart(2, "0")}</span>
            {t}
          </li>
        ))}
      </ol>
      <ul className="mt-6 space-y-2 text-sm text-muted">
        {phase.tasks.map((t) => (
          <li key={t}>• {t}</li>
        ))}
      </ul>
    </div>
  );
}
