import { useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHead } from "@/components/app/page-head";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { computeEstimate } from "@/lib/construction/estimate";
import { formatTsh } from "@/lib/format";
import { seedBrief, useJenga } from "@/lib/store";
import { cn } from "@/lib/cn";

export const Route = createFileRoute("/anza/mradi")({ component: MradiPage });

function MradiPage() {
  const project = useJenga((s) => s.project);
  const upsert = useJenga((s) => s.upsertProjectFromBrief);
  const toggle = useJenga((s) => s.toggleTask);
  const setNotes = useJenga((s) => s.setNotes);
  const brief = project?.brief ?? seedBrief;

  useEffect(() => {
    if (!useJenga.getState().project) upsert(brief);
  }, [brief, upsert]);

  const estimate = project?.estimate ?? computeEstimate(brief);
  const done = project?.doneTasks ?? [];
  const totalTasks = estimate.phases.reduce((n, p) => n + p.tasks.length, 0);
  const doneCount = done.length;
  const pct = totalTasks ? Math.round((doneCount / totalTasks) * 100) : 0;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHead
        title="Meneja wa Mradi"
        lede="Fuatilia hatua, bajeti na kazi za mafundi. Tiki kila kazi inapokamilika."
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-border bg-surface p-5">
          <p className="text-xs text-muted uppercase">Maendeleo</p>
          <p className="mt-1 font-display text-3xl font-medium tabular-nums">{pct}%</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-bg-warm">
            <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className="rounded-3xl border border-border bg-surface p-5">
          <p className="text-xs text-muted uppercase">Bajeti</p>
          <p className="mt-1 font-display text-2xl font-medium tabular-nums">
            {formatTsh(estimate.costMid, true)}
          </p>
        </div>
        <div className="rounded-3xl border border-border bg-surface p-5">
          <p className="text-xs text-muted uppercase">Kazi</p>
          <p className="mt-1 font-display text-2xl font-medium tabular-nums">
            {doneCount}/{totalTasks}
          </p>
        </div>
      </div>
      <div className="space-y-4">
        {estimate.phases.map((p) => (
          <div key={p.id} className="rounded-3xl border border-border bg-surface p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-sans text-base font-semibold">{p.title}</h2>
              <p className="text-xs text-muted tabular-nums">
                {p.weeks} wiki · {formatTsh(p.cost, true)}
              </p>
            </div>
            <ul className="mt-3 space-y-2">
              {p.tasks.map((t) => {
                const key = `${p.id}:${t}`;
                const on = done.includes(key);
                return (
                  <li key={key}>
                    <label className="flex cursor-pointer items-start gap-3 text-sm">
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => toggle(key)}
                        className="mt-1 size-4 accent-primary"
                      />
                      <span className={cn(on && "text-muted line-through")}>{t}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-3xl border border-border bg-surface p-5">
        <p className="mb-2 text-sm font-medium">Maelezo ya tovuti</p>
        <Textarea
          value={project?.notes ?? ""}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Andika maelezo kwa mafundi, tarehe za malipo, au maswali…"
        />
      </div>
      <Button asChild variant="outline" className="mt-6">
        <Link to="/anza/gharama">Sasisha bajeti</Link>
      </Button>
    </div>
  );
}
