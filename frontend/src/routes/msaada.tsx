import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const Route = createFileRoute("/msaada")({ component: MsaadaPage });

const FAQS = [
  {
    q: "Makadirio ni sahihi kiasi gani?",
    a: "Tunatoa range, si namba moja. Bei zinabadilika kwa mkoa, chapa ya saruji na msimu. Tumia kama mwongozo, kisha pata quote kutoka kwa fundi au QS.",
  },
  {
    q: "Je, ramani inatosha kwa kibali?",
    a: "Hapana. Ramani ya JengaAI ni mpango wa awali. Kibali kinahitaji drawings zilizotiwa saini na msanifu na, kwa ghorofa, mhandisi.",
  },
  {
    q: "Nawezaje kuagiza vifaa?",
    a: "Fungua Agiza Vifaa, ongeza kwenye kikapu, weka namba ya simu. Mshirika wa mkoa atakupigia kuthibitisha stoo.",
  },
  {
    q: "Premium inalipwaje?",
    a: "Katika onyesho hili Premium inawashwa kwenye kifaa chako. Toleo kamili litakuwa TSh 25,000 kwa mwezi.",
  },
];

function MsaadaPage() {
  return (
    <div className="min-h-screen bg-bg">
      <SiteHeader solid />
      <article className="mx-auto max-w-2xl px-5 py-16 md:px-8">
        <h1 className="font-display text-4xl font-medium">Msaada</h1>
        <p className="mt-3 text-muted">Maswali yanayoulizwa mara kwa mara.</p>
        <div className="mt-10 space-y-4">
          {FAQS.map((f) => (
            <div key={f.q} className="rounded-3xl border border-border bg-surface p-5">
              <h2 className="font-sans text-base font-semibold">{f.q}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{f.a}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 text-sm text-muted">
          Bado una swali?{" "}
          <Link to="/wasiliana" className="text-primary">
            Wasiliana nasi
          </Link>
          .
        </p>
      </article>
      <SiteFooter />
    </div>
  );
}
