import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { deleteDesign, listDesigns } from "@/lib/house/persist";
import { TEMPLATES } from "@/lib/house/templates";
import { useHouseStore } from "@/store/house-store";

export const Route = createFileRoute("/designs")({ component: DesignsPage });

function DesignsPage() {
  const [items, setItems] = useState(() => (typeof window === "undefined" ? [] : listDesigns()));
  const loadSpec = useHouseStore((s) => s.loadSpec);
  const navigate = useNavigate();
  const refresh = () => setItems(listDesigns());

  return (
    <div className="min-h-dvh bg-bg">
      <AppHeader />
      <main className="mx-auto max-w-5xl px-4 py-12">
        <h1 className="font-display text-4xl">My Designs</h1>
        <p className="mt-2 max-w-lg text-muted">
          Saved on this device. Open a home to keep configuring — 3D, plans and quantities stay in sync.
        </p>
        {items.length === 0 ? (
          <p className="mt-12 rounded-[24px] bg-surface px-6 py-16 text-center text-muted">
            Nothing saved yet. Pick a template from the gallery and hit Save.
          </p>
        ) : (
          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {items.map((d) => {
              const cover = TEMPLATES.find((t) => t.id === d.spec.templateId)?.cover;
              return (
                <li key={d.id} className="overflow-hidden rounded-[22px] bg-surface shadow-sm">
                  {cover && <img src={cover} alt="" className="h-40 w-full object-cover" />}
                  <div className="p-4">
                    <h2 className="font-medium">{d.name}</h2>
                    <p className="mt-1 text-sm text-muted">
                      {d.spec.bedrooms} bed · {d.spec.bathrooms} bath · {d.spec.plotWidth}×{d.spec.plotLength} ft
                    </p>
                    <p className="text-xs text-faint">{new Date(d.savedAt).toLocaleString()}</p>
                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          loadSpec(d.spec, d.id);
                          void navigate({ to: "/studio", search: { saved: d.id } });
                        }}
                      >
                        Open
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          deleteDesign(d.id);
                          refresh();
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
