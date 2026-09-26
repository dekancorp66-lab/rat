import { FolderOpen, Plus, Search } from "lucide-react";
import { useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { parseImported } from "@/lib/house/export";
import { TEMPLATES } from "@/lib/house/templates";
import { cn } from "@/lib/utils";
import { useHouseStore } from "@/store/house-store";
import { toast } from "sonner";

export function GalleryPage() {
  const navigate = useNavigate();
  const loadTemplate = useHouseStore((s) => s.loadTemplate);
  const loadSpec = useHouseStore((s) => s.loadSpec);
  const fileRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [beds, setBeds] = useState<number | "all">("all");
  const [baths, setBaths] = useState<number | "all">("all");
  const [style, setStyle] = useState("all");
  const [roof, setRoof] = useState("all");
  const [plot, setPlot] = useState("all");

  const styles = ["all", ...Array.from(new Set(TEMPLATES.map((t) => t.style)))];
  const roofs = ["all", "hip", "gable", "shed", "flat"];

  const list = useMemo(() => {
    return TEMPLATES.filter((t) => {
      if (q && !`${t.name} ${t.description} ${t.tagline}`.toLowerCase().includes(q.toLowerCase()))
        return false;
      if (beds !== "all" && t.bedrooms !== beds) return false;
      if (baths !== "all" && t.bathrooms !== baths) return false;
      if (style !== "all" && t.style !== style) return false;
      if (roof !== "all" && t.roof !== roof) return false;
      if (plot === "30" && t.minWidth > 32) return false;
      if (plot === "40" && t.minWidth > 42) return false;
      return true;
    });
  }, [q, beds, baths, style, roof, plot]);

  const openTemplate = (id: string) => {
    loadTemplate(id);
    void navigate({ to: "/studio", search: { template: id } });
  };

  return (
    <div className="min-h-dvh bg-bg">
      <main className="mx-auto w-full max-w-6xl px-4 pt-10 pb-20 md:px-6 md:pt-14">
        <div className="mx-auto max-w-2xl text-center">
          
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Button
              size="lg"
              className="rounded-full"
              onClick={() => document.getElementById("templates")?.scrollIntoView({ behavior: "smooth" })}
            >
              <Plus /> Choose a Home Design
            </Button>
            <Button
              size="lg"
              variant="secondary"
              className="rounded-full"
              onClick={() => fileRef.current?.click()}
            >
              <FolderOpen /> Open Existing File
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".json,.wadi,application/json"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const text = await file.text();
                const spec = parseImported(text);
                if (spec) {
                  loadSpec(spec);
                  void navigate({ to: "/studio" });
                } else {
                  toast.error("Could not read that file. Use a Wadi JSON export.");
                }
              }}
            />
          </div>
        </div>

        <div
          id="templates"
          className="mt-12 rounded-xl bg-surface p-3 shadow-[0_1px_0_rgb(31_26_22/0.04),0_12px_32px_rgb(31_26_22/0.05)] md:p-4"
        >
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex min-w-40 flex-1 items-center gap-2 rounded-full bg-chip px-3 py-2 text-sm">
              <Search className="size-4 text-muted" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search templates…"
                className="w-full bg-transparent text-fg outline-none placeholder:text-faint"
              />
            </label>
            <FilterSelect label="Bedrooms" value={String(beds)} onChange={(v) => setBeds(v === "all" ? "all" : Number(v))}>
              <option value="all">Bedrooms</option>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n} bed
                </option>
              ))}
            </FilterSelect>
            <FilterSelect
              label="Bathrooms"
              value={String(baths)}
              onChange={(v) => setBaths(v === "all" ? "all" : Number(v))}
            >
              <option value="all">Bathrooms</option>
              {[1, 2, 3].map((n) => (
                <option key={n} value={n}>
                  {n} bath
                </option>
              ))}
            </FilterSelect>
            <FilterSelect label="Style" value={style} onChange={setStyle}>
              {styles.map((s) => (
                <option key={s} value={s}>
                  {s === "all" ? "Style" : s}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect label="Roof Type" value={roof} onChange={setRoof}>
              {roofs.map((s) => (
                <option key={s} value={s}>
                  {s === "all" ? "Roof Type" : s}
                </option>
              ))}
            </FilterSelect>
            <div className="ml-auto flex flex-wrap items-center gap-2 text-sm text-muted">
              <span>Plot Width</span>
              <button
                type="button"
                onClick={() => setPlot(plot === "30" ? "all" : "30")}
                className={cn(
                  "rounded-full px-3 py-1.5",
                  plot === "30" ? "bg-primary text-primary-fg" : "bg-chip",
                )}
              >
                30 ft
              </button>
              <button
                type="button"
                onClick={() => setPlot(plot === "40" ? "all" : "40")}
                className={cn(
                  "rounded-full px-3 py-1.5",
                  plot === "40" ? "bg-primary text-primary-fg" : "bg-chip",
                )}
              >
                40 ft
              </button>
            </div>
          </div>
        </div>

        {list.length === 0 ? (
          <p className="mt-12 rounded-xl bg-surface px-6 py-16 text-center text-muted">
            No templates match those filters. Clear a filter to see more homes.
          </p>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {list.map((t) => (
              <article
                key={t.id}
                className="group overflow-hidden rounded-lg bg-surface shadow-[0_8px_28px_rgb(31_26_22/0.08)]"
              >
                <button type="button" onClick={() => openTemplate(t.id)} className="block w-full text-left">
                  <div className="relative aspect-portrait overflow-hidden">
                    <img
                      src={t.cover}
                      alt={t.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                  </div>
                </button>
                <div className="p-4">
                  <h3 className="text-lg leading-tight font-medium">{t.name}</h3>
                  <p className="mt-1 text-sm text-muted">{t.tagline}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span className="rounded-full bg-chip px-2.5 py-1 text-[11px] text-muted">{t.bedrooms} Bed</span>
                    <span className="rounded-full bg-chip px-2.5 py-1 text-[11px] text-muted">{t.bathrooms} Bath</span>
                    <span className="rounded-full bg-chip px-2.5 py-1 text-[11px] text-muted">{t.roofLabel}</span>
                    <span className="rounded-full bg-chip px-2.5 py-1 text-[11px] text-muted">{t.plotHint}</span>
                  </div>
                  <Button className="mt-4 w-full rounded-full" onClick={() => openTemplate(t.id)}>
                    This Design
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: ReactNode;
}) {
  return (
    <label>
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 rounded-full bg-chip px-3 text-sm text-fg outline-none"
      >
        {children}
      </select>
    </label>
  );
}
