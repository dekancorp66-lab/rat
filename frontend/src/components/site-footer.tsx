import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Apple, Facebook, Instagram, Linkedin, MessageCircle, Twitter, X, Youtube } from "lucide-react";
import { Logo } from "./logo";
import { useLanguage } from "@/contexts/language-context";

export function SiteFooter() {
  const { t } = useLanguage();
  const [legalPage, setLegalPage] = useState<"privacy" | "terms" | null>(null);

  return (
    <>
      <footer className="bg-ink text-primary-fg">
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

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-7 text-center text-xs text-white/45 md:px-8">
          <div className="flex flex-col items-center justify-between gap-5 sm:flex-row sm:text-left">
            <p>{t.footer.copyright}</p>
            <div className="flex items-center justify-center gap-3 sm:justify-end">
            {[
              { Icon: MessageCircle, href: "https://wa.me/255780315167?text=Hello%20JengaAI", label: "Chat with JengaAI on WhatsApp", brand: "text-[#25D366]" },
              { Icon: Facebook, href: "https://www.facebook.com/", label: "Facebook" },
              { Icon: Instagram, href: "https://www.instagram.com/", label: "Instagram" },
              { Icon: Twitter, href: "https://x.com/", label: "X" },
              { Icon: Linkedin, href: "https://www.linkedin.com/", label: "LinkedIn" },
              { Icon: Youtube, href: "https://www.youtube.com/", label: "YouTube" },
            ].map(({ Icon, href, label, brand }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={label}
                className={`grid size-10 place-items-center rounded-full border border-white/25 text-white/80 transition-colors hover:border-white hover:text-white ${brand ?? ""}`}
              >
                <Icon className="size-[18px]" />
              </a>
            ))}
            </div>
          </div>

          <div className="flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-5 sm:flex-row sm:text-left">
            <p className="text-sm text-white/70">Download the JengaAI app</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <a
                href="https://play.google.com/store"
                target="_blank"
                rel="noreferrer"
                className="flex min-w-[164px] items-center gap-2 rounded-lg bg-black px-3 py-2 text-left text-white transition-transform hover:-translate-y-0.5"
                aria-label="Get JengaAI on Google Play"
              >
                <span className="relative block size-7 overflow-hidden [clip-path:polygon(0_0,100%_50%,0_100%)]" aria-hidden="true">
                  <span className="absolute inset-0 bg-[linear-gradient(145deg,#33c481_0_34%,#ffd34e_34%_55%,#4d9cf5_55%_76%,#ee5b58_76%)]" />
                </span>
                <span className="leading-none"><small className="block text-[9px] uppercase tracking-wide text-white/75">Get it on</small><strong className="text-base font-medium">Google Play</strong></span>
              </a>
              <a
                href="https://www.apple.com/app-store/"
                target="_blank"
                rel="noreferrer"
                className="flex min-w-[164px] items-center gap-2 rounded-lg bg-black px-3 py-2 text-left text-white transition-transform hover:-translate-y-0.5"
                aria-label="Download JengaAI on the App Store"
              >
                <Apple className="size-7" fill="currentColor" />
                <span className="leading-none"><small className="block text-[9px] text-white/75">Download on the</small><strong className="text-base font-medium">App Store</strong></span>
              </a>
            </div>
          </div>
        </div>
      </div>
      </footer>
      {legalPage ? (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-ink/60 p-4" role="dialog" aria-modal="true" aria-labelledby="legal-title">
          <div className="w-full max-w-lg rounded-2xl bg-surface p-6 text-fg shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <h2 id="legal-title" className="text-2xl font-medium">{legalPage === "privacy" ? t.footer.privacy : t.footer.terms}</h2>
              <button type="button" onClick={() => setLegalPage(null)} className="grid size-9 place-items-center rounded-full text-muted hover:bg-bg-warm hover:text-fg" aria-label="Funga">
                <X className="size-4" />
              </button>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted">{legalPage === "privacy" ? t.footer.privacyBody : t.footer.termsBody}</p>
            <button type="button" onClick={() => setLegalPage(null)} className="mt-6 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-fg hover:bg-primary-hover">
              {t.footer.understood}
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
