import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { BookOpen, Home, Image, LineChart, MessageCircle, MessageSquare, Package, Palette, Pencil, Plug, Receipt, Scale, Search, ShoppingCart, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatThread } from "@/components/chat-thread";
import { FEATURES } from "@/lib/construction/data";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useJenga } from "@/lib/store";
import { useLanguage } from "@/contexts/language-context";

const VIDEO_ZA_HERO = ["/videos/hero-1.mp4", "/videos/hero-3.mp4", "/videos/14838378_3840_2160_60fps.mp4"];
const ICONS = [Home, BookOpen, Receipt, Package, Users, Palette, LineChart, Scale, ShoppingCart, MessageCircle];

function Eyebrow({ children }: { children: string }) {
  return <div className="mb-4 flex items-center gap-2 text-[11px] font-semibold tracking-[0.14em] text-primary uppercase"><span className="eyebrow-chevrons" aria-hidden><span /><span /><span /><span /><span /></span>{children}</div>;
}

export function LandingPage() {
  const [indexYaSasa, setIndexYaSasa] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [historyQuery, setHistoryQuery] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const bandRef = useRef<HTMLDivElement | null>(null);
  const offsetRef = useRef(0);
  const currentOffsetRef = useRef(0);
  const pointerTargetRef = useRef(0);
  const pointerActiveRef = useRef(false);
  const coarsePointerRef = useRef(false);
  const fullText = "Build Your Home with AI Support";
  const motionCards = [...FEATURES, ...FEATURES];
  const clearChat = useJenga((state) => state.clearChat);
  const { language } = useLanguage();
  const historyMessages: Array<{ id: string; content: string }> = [];

  useEffect(() => {
    const timer = window.setInterval(() => setIndexYaSasa((previousIndex) => (previousIndex + 1) % VIDEO_ZA_HERO.length), 6000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const checkCoarsePointer = () => { coarsePointerRef.current = window.matchMedia("(pointer: coarse)").matches; };
    checkCoarsePointer();
    const mediaQuery = window.matchMedia("(pointer: coarse)");
    mediaQuery.addEventListener("change", checkCoarsePointer);
    return () => mediaQuery.removeEventListener("change", checkCoarsePointer);
  }, []);

  useEffect(() => {
    let frame = 0;
    const animate = () => {
      if (bandRef.current) {
        const duplicateWidth = bandRef.current.scrollWidth / 2;
        if (duplicateWidth > 0) {
          const pointerBoost = pointerActiveRef.current && !coarsePointerRef.current ? pointerTargetRef.current * 0.0015 : 0;
          offsetRef.current += 0.45 + pointerBoost;
          if (offsetRef.current >= duplicateWidth) offsetRef.current -= duplicateWidth;
          const targetOffset = -duplicateWidth + offsetRef.current;
          currentOffsetRef.current += (targetOffset - currentOffsetRef.current) * 0.18;
          bandRef.current.style.transform = `translate3d(${currentOffsetRef.current}px, 0, 0)`;
        }
      }
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  const handleCardBandMove = (event: React.PointerEvent<HTMLElement>) => {
    if (coarsePointerRef.current) return;
    const rect = event.currentTarget.getBoundingClientRect();
    pointerTargetRef.current = ((event.clientX - (rect.left + rect.width / 2)) / rect.width) * 110;
    pointerActiveRef.current = true;
  };
  const handleCardBandLeave = () => { pointerTargetRef.current = 0; pointerActiveRef.current = false; };

  useEffect(() => {
    const isComplete = typedText === fullText;
    const delay = !isDeleting && isComplete ? 3000 : isDeleting ? 50 : 100;
    const timer = window.setTimeout(() => {
      if (!isDeleting && !isComplete) setTypedText(fullText.slice(0, typedText.length + 1));
      else if (!isDeleting && isComplete) setIsDeleting(true);
      else if (isDeleting && typedText.length > 0) setTypedText(fullText.slice(0, typedText.length - 1));
      else setIsDeleting(false);
    }, delay);
    return () => window.clearTimeout(timer);
  }, [fullText, isDeleting, typedText]);

  return <div className="min-h-screen bg-bg">
    <SiteHeader />
    <section className="relative -mt-16 flex min-h-[100svh] items-center overflow-hidden px-5 pt-16 md:-mt-[72px] md:px-8 md:pt-[72px]">
      <video key={VIDEO_ZA_HERO[indexYaSasa]} className="absolute inset-0 z-0 size-full object-cover" autoPlay muted loop playsInline preload="auto"><source src={VIDEO_ZA_HERO[indexYaSasa]} type="video/mp4" /></video>
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/60 via-black/25 to-black/70" />
      <div className="relative z-20 mx-auto max-w-2xl py-28 text-center md:py-36">
        <h1 className="min-h-[100px] font-display text-[2.35rem] leading-[1.12] font-medium tracking-tight text-white md:min-h-[130px] md:text-5xl lg:text-[3.35rem]">{typedText}<span className="ml-1 inline-block h-[35px] w-[3px] animate-pulse bg-primary align-middle md:h-[45px]" /></h1>
        <p className="mx-auto mt-5 max-w-md text-[15px] leading-relaxed text-white/80">Plan layouts, calculate building materials, and get accurate cost estimates for the Tanzanian market. Reduce costs and avoid construction mistakes.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3"><Button asChild size="lg"><Link to="/anza">Get Started</Link></Button><Button asChild size="lg" variant="outline"><a href="#sifa">Learn More</a></Button></div>
        <div className="mt-10 flex items-center justify-center gap-2">{VIDEO_ZA_HERO.map((src, index) => <span key={src} className={`h-1.5 rounded-full transition-all duration-500 ${index === indexYaSasa ? "w-6 bg-white" : "w-1.5 bg-white/40"}`} />)}</div>
      </div>
    </section>

    <section id="sifa" className="scroll-mt-24 px-5 py-16 md:px-8 md:py-24" onPointerMove={handleCardBandMove} onPointerLeave={handleCardBandLeave}>
      <div className="mx-auto max-w-6xl"><div className="mx-auto max-w-2xl text-center"><h2 className="font-display text-3xl font-medium tracking-tight md:text-4xl">Everything You Need to Plan Your Build</h2><p className="mt-3 text-sm leading-relaxed text-muted md:text-[15px]">Modern tools that help builders make confident, practical decisions at every stage of a project.</p></div>
        <div className="mt-12 overflow-hidden rounded-[32px]"><div ref={bandRef} className="flex w-max items-stretch gap-4 sm:gap-5">{motionCards.map((feature, index) => { const Icon = ICONS[index] ?? Home; return <a key={`${feature.id}-${index}`} href={feature.href} className="w-[250px] shrink-0 rounded-3xl border border-border bg-surface p-5 shadow-[var(--shadow-card)] sm:w-[270px] lg:w-[240px]"><span className="grid size-9 place-items-center rounded-xl bg-primary-soft text-primary"><Icon className="size-4" strokeWidth={1.8} /></span><h3 className="mt-4 font-sans text-[15px] font-semibold text-fg">{feature.title}</h3><p className="mt-2 text-xs leading-relaxed text-muted">{feature.body}</p></a>; })}</div></div>
      </div>
    </section>

    <section id="hatua" className="scroll-mt-24 bg-bg-warm/60 px-5 py-16 md:px-8 md:py-24"><div className="mx-auto max-w-6xl"><div className="mx-auto max-w-2xl text-center"><h2 className="font-display text-3xl font-medium tracking-tight md:text-4xl">Hatua 3 Rahisi Kujenga Ndoto Yako</h2><p className="mt-3 text-sm leading-relaxed text-muted">JengaAI imerahisisha mchakato mzima wa ujenzi uwe rahisi, wa wazi, na usio na usumbufu wa kupoteza fedha.</p></div><div className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">{[{ n: "01", t: "Eleza Mradi Wako", b: "Andika mahitaji ya nyumba yako. Kwa mfano, ‘Nataka nyumba ya vyumba vitatu vya kulala, sebuleni na jikoni, ya ghorofa moja, iliyopo Mwanza.’" }, { n: "02", t: "Pokea Makadirio", b: "AI yetu inachakata maelezo yako na kukupa makadirio ya jumla ya ujenzi, orodha kamili ya vifaa vya ujenzi vinavyohitajika na muda wa mradi." }, { n: "03", t: "Anza Kujenga", b: "Pakua ripoti kamili ya ramani ya vyumba, ratiba ya kazi kwa mafundi wako, na fanya manunuzi ya vifaa moja kwa moja kupitia washirika wetu." }].map((step) => <div key={step.n}><p className="font-display text-4xl font-medium text-primary">{step.n}</p><h3 className="mt-4 font-sans text-lg font-semibold">{step.t}</h3><p className="mt-2 text-sm leading-relaxed text-muted">{step.b}</p></div>)}</div></div></section>

    <section id="ai" className="scroll-mt-24 px-5 py-16 md:px-8 md:py-24"><div className="mx-auto max-w-6xl"><div className="grid overflow-hidden rounded-3xl border border-border bg-surface shadow-[var(--shadow-card)] md:grid-cols-[250px_minmax(0,1fr)]"><aside className="hidden border-r border-border bg-bg-warm/35 md:block"><div className="border-b border-border p-3"><button type="button" onClick={clearChat} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-fg hover:bg-surface"><Pencil className="size-4" /> {language === "sw" ? "Mazungumzo mapya" : "New chat"}</button><label className="mt-2 flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2"><Search className="size-4 shrink-0 text-muted" /><span className="sr-only">Search chats</span><input value={historyQuery} onChange={(event) => setHistoryQuery(event.target.value)} placeholder={language === "sw" ? "Tafuta chats..." : "Search chats..."} className="min-w-0 flex-1 bg-transparent text-xs text-fg outline-none placeholder:text-subtle" /></label></div><div className="border-b border-border p-3"><p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-subtle">{language === "sw" ? "Historia" : "History"}</p>{historyMessages.length > 0 ? <div className="space-y-1">{historyMessages.map((message) => <button key={message.id} type="button" className="flex w-full items-start gap-2 rounded-xl px-2.5 py-2 text-left text-xs text-fg hover:bg-surface"><MessageSquare className="mt-0.5 size-3.5 shrink-0 text-primary" /><span className="line-clamp-2">{message.content}</span></button>)}</div> : <p className="px-2 text-xs leading-relaxed text-muted">{language === "sw" ? "Mazungumzo yako yataonekana hapa." : "Your conversations will appear here."}</p>}</div><nav className="space-y-1 p-3 text-sm text-fg"><a href="#ai" className="flex items-center gap-3 rounded-xl bg-surface px-3 py-2.5"><Image className="size-4" /> Images</a><a href="#sifa" className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-surface"><Plug className="size-4" /> Plugins</a></nav></aside><div className="min-w-0 p-4 sm:p-5"><div className="mb-3 flex items-center justify-between"><div className="flex items-center gap-2 text-sm font-medium"><span className="size-2 rounded-full bg-success" />JengaAI Assistant</div><span className="text-xs text-subtle">Inafanya kazi</span></div><div className="mb-3 flex gap-2 overflow-x-auto md:hidden"><button type="button" onClick={clearChat} className="flex shrink-0 items-center gap-2 rounded-full border border-border px-3 py-2 text-xs text-fg"><Pencil className="size-3.5" /> {language === "sw" ? "Chat mpya" : "New chat"}</button><label className="flex shrink-0 items-center gap-2 rounded-full border border-border px-3 py-2 text-xs text-fg"><Search className="size-3.5" /><span className="sr-only">Search chats</span><input value={historyQuery} onChange={(event) => setHistoryQuery(event.target.value)} placeholder={language === "sw" ? "Tafuta history" : "Search history"} className="w-24 bg-transparent outline-none placeholder:text-subtle" /></label></div><ChatThread compact /></div></div></div></section>

    <section id="ushuhuda" className="scroll-mt-24 bg-bg-warm/60 px-5 py-16 md:px-8 md:py-24"><div className="mx-auto max-w-6xl"><div className="mx-auto max-w-2xl text-center"><Eyebrow>Wanasema nini</Eyebrow><h2 className="font-display text-3xl font-medium tracking-tight md:text-4xl">Wajenzi Wanaamini JengaAI</h2></div><div className="mt-10 grid gap-5 md:grid-cols-3"><figure className="rounded-3xl border border-border bg-surface p-6 shadow-[var(--shadow-card)]"><div className="text-lg tracking-[0.2em] text-primary" aria-label="5 kati ya 5 nyota">★★★★★</div><blockquote className="mt-3 text-sm leading-relaxed text-muted">“JengaAI imenisaidia kuelewa gharama na vifaa kabla sijaanza ujenzi.”</blockquote><figcaption className="mt-6 text-sm font-semibold text-fg">Alen Justinian</figcaption></figure><figure className="rounded-3xl border border-border bg-surface p-6 shadow-[var(--shadow-card)]"><div className="text-lg tracking-[0.2em] text-primary" aria-label="5 kati ya 5 nyota">★★★★★</div><blockquote className="mt-3 text-sm leading-relaxed text-muted">“Nimepata mwongozo wa hatua kwa hatua unaoeleweka na unaofaa kwa eneo langu.”</blockquote><figcaption className="mt-6 text-sm font-semibold text-fg">Derick Kapele</figcaption></figure><figure className="rounded-3xl border border-border bg-surface p-6 shadow-[var(--shadow-card)]"><div className="text-lg tracking-[0.2em] text-primary" aria-label="5 kati ya 5 nyota">★★★★★</div><blockquote className="mt-3 text-sm leading-relaxed text-muted">“Msaada wa AI umenipa ujasiri wa kupanga mradi wangu kwa usahihi zaidi.”</blockquote><figcaption className="mt-6 text-sm font-semibold text-fg">Selina</figcaption></figure></div></div></section>

    <section id="bei" className="scroll-mt-24 px-5 py-16 md:px-8 md:py-24"><div className="mx-auto max-w-6xl"><div className="mx-auto max-w-2xl text-center"><h2 className="font-display text-3xl font-medium tracking-tight md:text-4xl">Chagua Mpango Wako</h2><p className="mt-3 text-sm leading-relaxed text-muted">Anza kupanga ujenzi bure au jiunge na Premium kwa msaada mkubwa na wa kitaalamu zaidi kuanzia mwanzo hadi mwisho.</p></div><div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-2"><div className="rounded-3xl border border-border bg-surface p-8 shadow-[var(--shadow-card)]"><h3 className="font-sans text-lg font-semibold">Bure</h3><p className="mt-1 text-sm text-muted">Inafaa kwa mtu anayetaka kupata wazo la awali la gharama za ujenzi.</p><p className="mt-6 font-display text-4xl font-medium">TSh 0 <span className="text-base font-sans font-normal text-subtle">/ mwezi</span></p><ul className="mt-6 space-y-3 text-sm">{["Makadirio ya msingi ya gharama", "Kikokotoo cha kawaida cha vifaa", "Ushauri wa jumla wa ujenzi"].map((text) => <li key={text} className="flex gap-2"><span className="mt-1 size-2 rounded-full bg-primary" />{text}</li>)}</ul><Button asChild variant="outline" className="mt-8 w-full"><Link to="/anza">Anza Bure Sasa</Link></Button></div><div className="relative rounded-3xl bg-ink p-8 text-primary-fg shadow-[var(--shadow-card)]"><span className="absolute top-6 right-6 rounded-full bg-primary px-3 py-1 text-[10px] font-semibold tracking-wider uppercase">Inapendekezwa</span><h3 className="font-sans text-lg font-semibold">Premium</h3><p className="mt-1 text-sm text-white/60">Mpango kamili kwa ujenzi makini usio na makosa wala gharama za siri.</p><p className="mt-6 font-display text-4xl font-medium">TSh 25,000 <span className="text-base font-sans font-normal text-white/50">/ mwezi</span></p><ul className="mt-6 space-y-3 text-sm text-white/85">{["Ramani kamili ya vyumba (2D floor plan)", "Meneja wa mradi wa AI", "Ongea na wasanifu na wahandisi", "Orodha ya ununuzi na kuagiza vifaa", "Vibali na sheria za ujenzi za manispaa"].map((text) => <li key={text} className="flex gap-2"><span className="mt-1 size-2 rounded-full bg-primary" />{text}</li>)}</ul><Button asChild className="mt-8 w-full"><a href="/anza?upgrade=1">Jiunge na Premium</a></Button></div></div></div></section>
    <SiteFooter />
  </div>;
}