const MARQUEE_TEXT = [
  "KIKOKOTOO CHA GHARAMA NA VIFAA",
  "CHORA RAMANI YAKO KWA USAHIHI",
  "MSHAURI WA UJENZI",
  "AGIZA VIFAA",
] as const;

export function TextMarquee() {
  return (
    <section className="overflow-hidden bg-orange-100 py-3 md:py-4" aria-label="Huduma za JengaAI">
      <div className="overflow-hidden">
        <div className="flex w-max motion-safe:animate-marquee whitespace-nowrap text-sm font-bold leading-tight text-orange-900 md:text-base">
          <div className="flex shrink-0 items-center gap-8 pr-8 md:gap-12 md:pr-12">
            {MARQUEE_TEXT.map((text) => (
              <span key={text} className="shrink-0">
                {text}
              </span>
            ))}
          </div>
          <div
            className="flex shrink-0 items-center gap-8 pr-8 md:gap-12 md:pr-12"
            aria-hidden="true"
          >
            {MARQUEE_TEXT.map((text) => (
              <span key={`duplicate-${text}`} className="shrink-0">
                {text}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
