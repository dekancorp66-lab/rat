import { useEffect } from "react";
import { useLanguage } from "@/contexts/language-context";
import { cn } from "@/lib/cn";

const LANGUAGES = ["sw", "en"] as const;

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage();

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <div
      aria-label={t.nav.language}
      className="flex items-center gap-1 rounded-full border border-border p-1 text-xs"
      role="group"
    >
      {LANGUAGES.map((code) => {
        const active = language === code;
        return (
          <button
            key={code}
            type="button"
            aria-label={`${t.nav.language}: ${code.toUpperCase()}`}
            aria-pressed={active}
            className={cn(
              "rounded-full px-2 py-1 font-medium transition-colors",
              active ? "bg-fg text-bg" : "text-muted hover:text-fg",
            )}
            onClick={() => setLanguage(code)}
          >
            {code.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
