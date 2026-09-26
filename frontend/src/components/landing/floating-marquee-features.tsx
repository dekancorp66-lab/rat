const FEATURES = [
  "RAMANI",
  "KIKOKOTOO CHA GHARAMA NA VIFAA",
  "SHERIA ZA UJENZI",
  "MSHAURI WA UJENZI",
] as const;

export function FloatingMarqueeFeatures() {
  return (
    <>
      <section className="overflow-hidden bg-orange-100/70 py-2 md:py-2.5">
        <div className="overflow-hidden" aria-label="Huduma za JengaAI">
          <div className="flex w-max animate-marquee whitespace-nowrap text-sm font-bold leading-none text-orange-900 md:text-base">
            <div className="flex shrink-0 items-center gap-8 pr-8 md:gap-12 md:pr-12">
              {FEATURES.map((feature) => (
                <span className="shrink-0" key={feature}>
                  {feature}
                </span>
              ))}
            </div>
            <div
              className="flex shrink-0 items-center gap-8 pr-8 md:gap-12 md:pr-12"
              aria-hidden="true"
            >
              {FEATURES.map((feature) => (
                <span className="shrink-0" key={`duplicate-${feature}`}>
                  {feature}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>
      <h2 className="mt-6 px-4 text-center font-display text-2xl font-medium tracking-tight text-fg md:text-3xl">
        YANAYOPATIKANA KWENYE JENGA-AI
      </h2>
    </>
  );
}