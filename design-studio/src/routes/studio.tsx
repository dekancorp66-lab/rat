import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { ConfiguratorPanel } from "@/components/configurator-panel";
import { StudioViewport } from "@/components/studio-viewport";
import { useHouseStore } from "@/store/house-store";
import { MoreVertical, SlidersHorizontal } from "lucide-react";

type Search = {
  template?: string;
  spec?: string;
  saved?: string;
};

export const Route = createFileRoute("/studio")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    template: typeof s.template === "string" ? s.template : undefined,
    spec: typeof s.spec === "string" ? s.spec : undefined,
    saved: typeof s.saved === "string" ? s.saved : undefined,
  }),
  component: StudioPage,
});

function StudioPage() {
  const search = Route.useSearch();
  const hydrate = useHouseStore((s) => s.hydrateFromSearch);
  const spec = useHouseStore((s) => s.spec);
  const setPartial = useHouseStore((s) => s.setPartial);
  const tab = useHouseStore((s) => s.viewTab);
  // Closed by default so phones open on the model; md+ screens always show the panel via CSS.
  const [open, setOpen] = useState(false);
  const [panelHidden, setPanelHidden] = useState(false);

  useEffect(() => {
    hydrate(search);
  }, [search, hydrate]);

  return (
    <div className="flex h-dvh flex-col bg-bg">
      <AppHeader studio />
      <div className="relative flex min-h-0 flex-1">
        <div
          className={`${open ? "translate-x-0" : "-translate-x-full"} fixed inset-y-14 left-0 z-20 w-[min(100%,320px)] border-r border-border bg-bg transition-transform duration-[var(--motion-fast)] md:static md:translate-x-0 ${panelHidden ? "md:hidden" : "md:flex md:w-[300px] lg:w-[320px]"}`}
        >
          <ConfiguratorPanel
            spec={spec}
            onChange={setPartial}
            tab={tab}
            onBack={() => setOpen(false)}
            onHide={() => setPanelHidden(true)}
          />
        </div>
        {panelHidden && (
          <button
            type="button"
            onClick={() => setPanelHidden(false)}
            className="no-print absolute top-4 left-4 z-20 hidden rounded-full bg-surface p-2 text-muted shadow-md hover:bg-chip md:flex"
            aria-label="Show configurator"
          >
            <MoreVertical className="size-4" />
          </button>
        )}
        {!open && (
          <button
            type="button"
            className="no-print absolute bottom-44 left-6 z-20 rounded-full bg-surface px-3 py-2 text-sm shadow-md md:hidden"
            onClick={() => setOpen(true)}
          >
            <SlidersHorizontal className="mr-1 inline size-4" /> Configure
          </button>
        )}
        <StudioViewport />
      </div>
    </div>
  );
}
