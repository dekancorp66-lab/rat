import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHead } from "@/components/app/page-head";
import { Input } from "@/components/ui/input";
import { CONTRACTORS_REGISTRATION_ACT, REGULATIONS } from "@/lib/construction/data";

export const Route = createFileRoute("/anza/sheria")({ component: SheriaPage });

function SheriaPage() {
  const [q, setQ] = useState("");
  const items = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return REGULATIONS;
    return REGULATIONS.filter(
      (r) => r.title.toLowerCase().includes(s) || r.body.toLowerCase().includes(s),
    );
  }, [q]);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHead
        title="Sheria za Ujenzi"
        lede="Kanuni muhimu za Tanzania: vibali vya manispaa, hatimiliki, setbacks, mikataba na usalama. Hii ni mwongozo — thibitisha na halmashauri yako."
      />
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Tafuta: kibali, NEMC, mkataba…"
        className="mb-6"
      />
      <div className="space-y-4">
        {items.map((r) => (
          <article key={r.id} className="rounded-3xl border border-border bg-surface p-5">
            <h2 className="font-sans text-base font-semibold">{r.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{r.body}</p>
          </article>
        ))}
        {items.length === 0 ? <p className="text-sm text-muted">Hakuna matokeo.</p> : null}
      </div>

      <section className="mt-10 rounded-3xl border border-border bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6">
        <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Official reference</p>
            <h2 className="mt-2 font-sans text-xl font-semibold text-fg">{CONTRACTORS_REGISTRATION_ACT.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{CONTRACTORS_REGISTRATION_ACT.summary}</p>
          </div>
          <a
            href={CONTRACTORS_REGISTRATION_ACT.source}
            target="_blank"
            rel="noreferrer"
            className="inline-flex shrink-0 items-center justify-center rounded-xl border border-border px-4 py-2 text-sm font-semibold text-primary hover:bg-primary-soft"
          >
            Open source PDF
          </a>
        </div>

        <div className="mt-6 space-y-6">
          {CONTRACTORS_REGISTRATION_ACT.parts.map((part) => (
            <div key={part.title}>
              <h3 className="font-sans text-base font-semibold text-fg">{part.title}</h3>
              <div className="mt-3 divide-y divide-border rounded-2xl border border-border">
                {part.sections.map((section) => (
                  <article key={section.number} className="p-4">
                    <h4 className="text-sm font-semibold text-fg">
                      {section.number}. {section.title}
                    </h4>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted">{section.detail}</p>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 border-t border-border pt-6">
          <h3 className="font-sans text-lg font-semibold text-fg">{CONTRACTORS_REGISTRATION_ACT.schedule.title}</h3>
          <div className="mt-3 divide-y divide-border rounded-2xl border border-border">
            {CONTRACTORS_REGISTRATION_ACT.schedule.sections.map((section) => (
              <article key={section.number} className="p-4">
                <h4 className="text-sm font-semibold text-fg">
                  {section.number}. {section.title}
                </h4>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{section.detail}</p>
              </article>
            ))}
          </div>
        </div>

        <p className="mt-6 border-t border-border pt-4 text-xs leading-relaxed text-subtle">
          This is a practical summary, not legal advice. The official Act and current regulations take priority. Confirm contractor registration, project class, permits and enforcement requirements with the Contractors Registration Board and the relevant authority.
        </p>
      </section>
    </div>
  );
}
