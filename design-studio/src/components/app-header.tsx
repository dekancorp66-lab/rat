import { Link, useRouterState } from "@tanstack/react-router";
import { Camera, Download, Redo2, Save, Share2, Undo2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { downloadText, estimateCsv, houseToDxf, specToJson } from "@/lib/house/export";
import { downloadSvg, housePlanSvg } from "@/lib/house/plan-svg";
import { encodeSpec } from "@/lib/house/persist";
import { cn } from "@/lib/utils";
import { useHouseStore } from "@/store/house-store";

export function WadiMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "grid size-8 place-items-center rounded-xs bg-primary font-semibold text-primary-fg",
        className,
      )}
    >
      M
    </span>
  );
}

export function AppHeader({ studio }: { studio?: boolean }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const spec = useHouseStore((s) => s.spec);
  const model = useHouseStore((s) => s.model);
  const planFloor = useHouseStore((s) => s.planFloor);
  const undo = useHouseStore((s) => s.undo);
  const redo = useHouseStore((s) => s.redo);
  const save = useHouseStore((s) => s.save);
  const history = useHouseStore((s) => s.history);
  const future = useHouseStore((s) => s.future);

  const share = async () => {
    const url = `${window.location.origin}/studio?spec=${encodeSpec(spec)}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Share link copied");
    } catch {
      toast.message(url);
    }
  };

  const nav = [
    { to: "/", label: "Gallery", active: pathname === "/" },
    { to: "/studio", label: "Studio", active: pathname === "/studio" },
    { to: "/designs", label: "My Designs", active: pathname === "/designs" },
    { to: "/help", label: "Help", active: pathname === "/help" },
  ] as const;

  return (
    <header className="no-print sticky top-0 z-30 relative flex h-14 items-center gap-2 border-b border-border/80 bg-bg/90 px-3 backdrop-blur-md md:gap-3 md:px-5">
      
      <nav className="absolute left-1/2 flex min-w-0 -translate-x-1/2 items-center gap-3 overflow-x-auto text-sm md:gap-6">
        {nav.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "shrink-0 text-sm",
              item.active ? "font-medium text-primary" : "text-muted hover:text-fg",
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="ml-auto flex items-center gap-1 md:ml-0">
        {studio && (
          <>
            <Button variant="ghost" size="icon" onClick={undo} disabled={!history.length} aria-label="Undo">
              <Undo2 />
            </Button>
            <Button variant="ghost" size="icon" onClick={redo} disabled={!future.length} aria-label="Redo">
              <Redo2 />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Capture 3D view"
              onClick={() => {
                const url = window.__wadiCapture?.(720);
                if (url) {
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "wadi-shot.jpg";
                  a.click();
                  toast.success("Shot saved");
                } else toast.message("Open the 3D tab to capture");
              }}
            >
              <Camera />
            </Button>
            <ExportMenu
              onDxf={() => downloadText(`${spec.name.replace(/\s+/g, "-").toLowerCase()}.dxf`, houseToDxf(spec, planFloor), "application/dxf")}
              onSvg={() =>
                downloadSvg(
                  `${spec.name.replace(/\s+/g, "-").toLowerCase()}-plan.svg`,
                  housePlanSvg(model, planFloor),
                )
              }
              onCsv={() =>
                downloadText(`${spec.name.replace(/\s+/g, "-").toLowerCase()}-bom.csv`, estimateCsv(spec), "text/csv")
              }
              onJson={() =>
                downloadText(`${spec.name.replace(/\s+/g, "-").toLowerCase()}.json`, specToJson(spec), "application/json")
              }
            />
            <Button
              variant="secondary"
              size="icon"
              className="rounded-full sm:hidden"
              aria-label="Save"
              onClick={() => {
                save();
                toast.success("Design saved");
              }}
            >
              <Save />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="ml-1 hidden rounded-full sm:inline-flex"
              onClick={() => {
                save();
                toast.success("Design saved");
              }}
            >
              Save
            </Button>
            <Button size="icon" className="rounded-full sm:hidden" aria-label="Share" onClick={() => void share()}>
              <Share2 />
            </Button>
            <Button size="sm" className="hidden rounded-full sm:inline-flex" onClick={() => void share()}>
              Share
            </Button>
          </>
        )}
        {!studio && (
          <Button variant="ghost" size="icon" onClick={() => void share()} aria-label="Share">
            <Share2 />
          </Button>
        )}
      </div>
    </header>
  );
}

function ExportMenu({
  onDxf,
  onSvg,
  onCsv,
  onJson,
}: {
  onDxf: () => void;
  onSvg: () => void;
  onCsv: () => void;
  onJson: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <Button variant="ghost" size="icon" aria-label="Export" onClick={() => setOpen((v) => !v)}>
        <Download />
      </Button>
      {open && (
        <>
          <button type="button" className="fixed inset-0 z-40 cursor-default" aria-label="Close export menu" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-md border border-border bg-surface py-1 text-sm shadow-lg">
            {[
              { label: "Floor plan (SVG)", run: onSvg },
              { label: "CAD drawing (DXF)", run: onDxf },
              { label: "Quantities (CSV)", run: onCsv },
              { label: "Design file (JSON)", run: onJson },
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                className="block w-full px-3 py-2 text-left hover:bg-chip"
                onClick={() => {
                  item.run();
                  setOpen(false);
                  toast.success("Downloaded");
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
