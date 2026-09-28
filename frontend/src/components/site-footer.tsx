import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Apple, X } from "lucide-react";
import { Logo } from "./logo";
import { useLanguage } from "@/contexts/language-context";

function GooglePlayIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Bluu — upande wa kushoto */}
      <path
        d="M3.609 1.814A.996.996 0 0 0 3 2.734v18.532c0 .39.226.74.609.92L13.792 12 3.609 1.814Z"
        fill="#4285F4"
      />
      {/* Kijani — sehemu ya juu */}
      <path
        d="M16.801 8.99 14.499 11.292 3.45 2.658A1.466 1.466 0 0 1 4.396 2.48l12.405 6.51Z"
        fill="#34A853"
      />
      {/* Nyekundu — sehemu ya chini */}
      <path
        d="M14.499 12.708 16.801 15.01 4.396 21.52a1.466 1.466 0 0 1-.946-.178l11.049-8.634Z"
        fill="#EA4335"
      />
      {/* Njano — ncha ya kulia (kishale) */}
      <path
        d="M20.522 11.001 16.801 8.99l-2.302 2.302 2.302 2.302 3.721-2.011a1.49 1.49 0 0 0 0-2.582Z"
        fill="#FBBC04"
      />
    </svg>
  );
}

export function SiteFooter() {
  const { t } = useLanguage();
  const [legalPage, setLegalPage] = useState<"privacy" | "terms" | null>(null);

  return (
    <>
      <footer className="bg-ink text-primary-fg">
        {/* Main Grid Content */}
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-10 sm:grid-cols-2 sm:px-6 md:grid-cols-4 md:gap-10 md:px-8 md:py-14">
          <div className="md:col-span-1">
            <div className="flex justify-center md:justify-start">
              <Logo dark />
            </div>
            <p className="mt-4 max-w-xs text-center text-sm leading-relaxed text-white/60 md:text-left">
              {t.footer.description}
            </p>
          </div>

          <div className="text-center md:text-left">
            <h3 className="font-sans text-xs font-semibold tracking-wider text-white/50 uppercase">
              {t.footer.services}
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-white/80">
              <li>
                <Link to="/anza/gharama" className="hover:text-white">
                  Gharama za Ujenzi
                </Link>
              </li>
              <li>
                <Link to="/anza/vifaa" className="hover:text-white">
                  Hesabu Vifaa
                </Link>
              </li>
              <li>
                <Link to="/anza/mradi" className="hover:text-white">
                  Meneja wa Mradi
                </Link>
              </li>
            </ul>
          </div>

          <div className="text-center md:text-left">
            <h3 className="font-sans text-xs font-semibold tracking-wider text-white/50 uppercase">
              {t.footer.company}
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-white/80">
              <li>
                <Link to="/kuhusu" className="hover:text-white">
                  {t.footer.about}
                </Link>
              </li>
              <li>
                <Link to="/msaada" className="hover:text-white">
                  {t.footer.help}
                </Link>
              </li>
              <li>
                <Link to="/wasiliana" className="hover:text-white">
                  {t.footer.contactLink}
                </Link>
              </li>
              <li>
                <button type="button" onClick={() => setLegalPage("privacy")} className="hover:text-white">
                  {t.footer.privacy}
                </button>
              </li>
              <li>
                <button type="button" onClick={() => setLegalPage("terms")} className="hover:text-white">
                  {t.footer.terms}
                </button>
              </li>
            </ul>
          </div>

          <div className="text-center md:text-left">
            <h3 className="font-sans text-xs font-semibold tracking-wider text-white/50 uppercase">
              {t.footer.contact}
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-white/80">
              <li>{t.footer.location}</li>
              <li>
                <a
                  href="https://jengaai.co.tz"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white"
                >
                  jengaai.co.tz
                </a>
              </li>
              <li>
                <a href="tel:+255780315167" className="hover:text-white">
                  +255 780315167
                </a>
              </li>
              <li>
                <a href="tel:+255781392051" className="hover:text-white">
                  +255 781392051
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar Content */}
        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-7 text-center text-xs text-white/45 md:px-8">
            <div className="flex flex-col items-center justify-between gap-5 sm:flex-row sm:text-left">
              <p>{t.footer.copyright}</p>

              {/* Mitandao ya kijamii yenye Rangi na Logo Halisi kama kwenye picha */}
              <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-end">
                {/* WhatsApp (Nembo ya Kijani kibichi chenye pembe za mviringo) */}
                <a
                  href="https://wa.me/255780315167?text=Hello%20JengaAI"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Chat with JengaAI on WhatsApp"
                  className="grid size-10 place-items-center rounded-xl bg-[#128C7E] text-white transition-transform hover:scale-105 shadow-md"
                >
                  <svg className="size-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.004 2c-5.51 0-9.99 4.48-9.99 9.99 0 2.06.63 3.99 1.73 5.61L2.1 22l4.56-1.19c1.54.91 3.32 1.43 5.34 1.43 5.51 0 9.99-4.48 9.99-9.99S17.514 2 12.004 2zm4.99 13.99c-.21.58-.83 1.11-1.44 1.32-.43.15-.99.27-2.91-.53-2.45-1.02-4.04-3.51-4.16-3.68-.12-.17-.99-1.32-.99-2.52 0-1.2.62-1.79.84-2.03.22-.24.49-.3.65-.3.16 0 .33.01.47.01.15 0 .35-.06.55.42.2.49.69 1.68.75 1.8.06.12.1.26.02.42-.08.17-.12.27-.24.41-.12.14-.26.32-.37.43-.12.12-.25.26-.11.5.14.24.63 1.03 1.35 1.67.92.82 1.7 1.08 1.94 1.2.24.12.38.1.52-.06.14-.17.61-.71.78-.96.17-.24.34-.2.57-.12.23.09 1.47.69 1.72.82.25.12.42.19.48.29.06.11.06.63-.15 1.21z" />
                  </svg>
                </a>

                {/* Instagram (Gradient ya Violet-Pink-Njano) */}
                <a
                  href="https://www.instagram.com/"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram"
                  className="grid size-10 place-items-center rounded-xl bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white transition-transform hover:scale-105 shadow-md"
                >
                  <svg className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                </a>

                {/* Facebook (Nembo ya Bluu safi yenye herufi f nyeupe katikati kama kwenye picha) */}
                <a
                  href="https://www.facebook.com/"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Facebook"
                  className="grid size-10 place-items-center rounded-xl bg-[#1877F2] text-white transition-transform hover:scale-105 shadow-md"
                >
                  <svg className="size-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>

                {/* YouTube (Nembo ya mstatili mwekundu wenye pembe laini na kishale cheupe) */}
                <a
                  href="https://www.youtube.com/"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="YouTube"
                  className="grid size-10 place-items-center rounded-xl bg-[#FF0000] text-white transition-transform hover:scale-105 shadow-md"
                >
                  <svg className="size-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.516 0-9.387.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.503 5.837a3.003 3.003 0 0 0 2.11 2.11c1.871.508 9.387.508 9.387.508s7.517 0 9.387-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>

                {/* LinkedIn (Nembo ya Bluu ya giza yenye herufi 'in' kama kwenye picha) */}
                <a
                  href="https://www.linkedin.com/"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="LinkedIn"
                  className="grid size-10 place-items-center rounded-xl bg-[#0A66C2] text-white transition-transform hover:scale-105 shadow-md"
                >
                  <svg className="size-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>

                {/* X / Twitter (Nembo ya kisasa Nyeusi na Nyeupe kama kwenye picha) */}
                <a
                  href="https://x.com/"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="X"
                  className="grid size-10 place-items-center rounded-xl bg-black text-white transition-transform hover:scale-105 shadow-md border border-white/10"
                >
                  <svg className="size-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* App Store & Google Play Download Links */}
            <div className="flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-5 sm:flex-row sm:text-left">
              <p className="text-sm text-white/70">Download the JengaAI app</p>
              <div className="flex flex-wrap items-center justify-center gap-3">

                {/* Google Play Store yenye Nembo Sahihi ya Pembetatu ya Rangi 4 kama kwenye picha */}
                <a
  href="https://play.google.com/store"
  target="_blank"
  rel="noreferrer"
  aria-label="Get JengaAI on Google Play"
  className="
    inline-flex
    h-[58px]
    min-w-[180px]
    items-center
    gap-3
    rounded-[10px]
    bg-black
    px-4
    py-2
    text-left
    text-white
    border
    border-white/10
    shadow-sm
    transition-transform
    duration-200
    hover:-translate-y-0.5
  "
>
  {/* Google Play Icon */}
  <span className="flex h-[42px] w-[42px] shrink-0 items-center justify-center">
    <svg
      width="38"
      height="38"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="block"
      aria-hidden="true"
    >
      {/* Blue */}
      <path
        d="M5.18 3.52C4.43 4.3 4 5.51 4 7.06V40.94C4 42.49 4.43 43.7 5.18 44.48L5.37 44.67L24.35 24.35V23.65L5.37 3.33L5.18 3.52Z"
        fill="#4285F4"
      />

      {/* Green */}
      <path
        d="M30.67 30.76L24.35 24.35V23.65L30.67 17.24L30.82 17.32L38.32 21.58C40.47 22.8 40.47 25.2 38.32 26.42L30.82 30.68L30.67 30.76Z"
        fill="#FBBC04"
      />

      {/* Red */}
      <path
        d="M30.82 30.68L24.35 24L5.18 44.48C6.02 45.36 7.38 45.46 8.91 44.59L30.82 30.68Z"
        fill="#EA4335"
      />

      {/* Green */}
      <path
        d="M30.82 17.32L8.91 3.41C7.38 2.54 6.02 2.64 5.18 3.52L24.35 24L30.82 17.32Z"
        fill="#34A853"
      />
    </svg>
  </span>

  {/* Google Play Text */}
  <span className="flex flex-col justify-center leading-none">
    <span className="mb-1 text-[9px] font-medium uppercase tracking-[0.08em] text-white/70">
      Get it on
    </span>

    <span className="text-[16px] font-semibold tracking-tight text-white">
      Google Play
    </span>
  </span>
</a>
                {/* iOS App Store */}
                <a
                  href="https://www.apple.com/app-store/"
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-w-[164px] items-center gap-3 rounded-lg bg-black px-4 py-2 text-left text-white transition-transform hover:-translate-y-0.5 border border-white/10"
                  aria-label="Download JengaAI on the App Store"
                >
                  <Apple className="size-6 shrink-0" fill="currentColor" />
                  <span className="leading-none">
                    <small className="block text-[9px] text-white/60">Download on the</small>
                    <strong className="text-sm font-semibold tracking-tight">App Store</strong>
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Legal Popups / Modal System */}
      {legalPage && (
        <div className="fixed inset-0 z- grid place-items-center bg-ink/60 p-4" role="dialog" aria-modal="true" aria-labelledby="legal-title">
          <div className="w-full max-w-lg rounded-2xl bg-surface p-6 text-fg shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <h2 id="legal-title" className="text-2xl font-medium">
                {legalPage === "privacy" ? t.footer.privacy : t.footer.terms}
              </h2>
              <button
                type="button"
                onClick={() => setLegalPage(null)}
                className="grid size-9 place-items-center rounded-full text-muted hover:bg-bg-warm hover:text-fg"
                aria-label="Funga"
              >
                <X className="size-4" />
              </button>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              {legalPage === "privacy" ? t.footer.privacyBody : t.footer.termsBody}
            </p>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setLegalPage(null)}
                className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-fg hover:bg-primary/90"
              >
                {t.footer.understood}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}