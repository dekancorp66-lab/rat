import { createFileRoute } from "@tanstack/react-router";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const Route = createFileRoute("/kuhusu")({ component: KuhusuPage });

function KuhusuPage() {
  return (
    <div className="min-h-screen bg-bg">
      <SiteHeader solid />
      <article className="mx-auto max-w-2xl px-5 py-16 md:px-8">
        <p className="text-xs font-semibold tracking-wider text-primary uppercase">Kampuni</p>
        <h1 className="mt-2 font-display text-4xl font-medium">Kuhusu JengaAI</h1>
        <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-muted">
          <p>
            JengaAI ni msaada wa kwanza wa AI wa ujenzi nchini Tanzania. Tumejengwa
            Dodoma ili kusaidia familia kupanga nyumba bila kupoteza fedha kwa
            makosa ya ramani, vifaa au mafundi.
          </p>
          <p>
            Tunachanganya data ya soko la vifaa — saruji, nondo, mchanga, bati —
            na ushauri wa wasanifu na wahandisi, kisha tunakupa makadirio, ramani
            ya awali na ratiba unayoweza kufuatilia.
          </p>
          <p>
            Hii si mkandarasi. Sisi ni zana ya kupanga: wewe unachagua fundi,
            unathibitisha vibali na unajenga. Sisi tunakupa namba na hatua za
            wazi kabla hujachimba msingi.
          </p>
        </div>
      </article>
      <SiteFooter />
    </div>
  );
}
