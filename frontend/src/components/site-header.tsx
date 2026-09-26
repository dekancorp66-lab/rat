import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { Logo } from "./logo";
import { LanguageSwitcher } from "./language-switcher";
import { Button } from "./ui/button";
import { cn } from "@/lib/cn";
import { useLanguage } from "@/contexts/language-context";

export function SiteHeader({ solid = false }: { solid?: boolean }) {
  const [open, setOpen] = useState(false);
  const { t } = useLanguage();

  // 3. Tumehamisha NAV ndani ya component ili iweze kusoma mabadiliko ya lugha kupitia t()
  const NAV = [
    { href: "/#sifa", label: t.nav.features },
    { href: "/#mifano", label: t.nav.examples },
    { href: "/#bei", label: t.nav.pricing },
  ];

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-transparent",
        solid ? "border-border bg-bg/95 backdrop-blur" : "bg-bg/90 backdrop-blur",
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 md:h-[72px] md:px-8">
        <Logo />
        <nav className="hidden items-center gap-8 text-sm text-muted md:flex">
          {NAV.map((n) => (
            <a key={n.href} href={n.href} className="hover:text-fg">
              {n.label}
            </a>
          ))}
        </nav>
        <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
          <LanguageSwitcher />
          <Button asChild size="md" className="hidden sm:inline-flex">
            <Link to="/anza">{t.nav.start}</Link>
          </Button>
          <button
            type="button"
            className="grid size-10 place-items-center rounded-full md:hidden"
            // 5. Tunasoma aria-label kulingana na lugha iliyochaguliwa
            aria-label={open ? t.nav.closeMenu : t.nav.openMenu}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>
      {open ? (
        <div className="border-t border-border bg-bg px-5 py-4 md:hidden">
          <div className="flex flex-col gap-3 text-sm">
            {NAV.map((n) => (
              <a
                key={n.href}
                href={n.href}
                className="py-2 text-fg"
                onClick={() => setOpen(false)}
              >
                {n.label}
              </a>
            ))}
            <Button asChild className="mt-2 w-full">
              <Link to="/anza">{t.nav.start}</Link>
            </Button>
          </div>
        </div>
      ) : null}
    </header>
  );
}
