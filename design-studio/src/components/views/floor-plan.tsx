import { useMemo } from "react";
import { Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadSvg, housePlanSvg } from "@/lib/house/plan-svg";
import type { HouseModel } from "@/lib/house/types";

// The 3D "Rendered view" panel was removed on purpose: this tab is now just the
// drawing sheet, so it also no longer loads the heavy 3D canvas.
export function FloorPlanView({
  model,
  floor,
  onFloor,
}: {
  model: HouseModel;
  floor: 0 | 1;
  onFloor: (f: 0 | 1) => void;
}) {
  const svg = useMemo(() => housePlanSvg(model, floor), [model, floor]);
  const stem = model.spec.name.replace(/\s+/g, "-").toLowerCase();

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="no-print mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 rounded-full bg-surface p-1 shadow-sm">
          <button
            type="button"
            className={`min-h-9 rounded-full px-4 py-1.5 text-sm ${floor === 0 ? "bg-chip font-medium" : "text-muted"}`}
            onClick={() => onFloor(0)}
          >
            Ground Floor
          </button>
          {model.stories === 2 && (
            <button
              type="button"
              className={`min-h-9 rounded-full px-4 py-1.5 text-sm ${floor === 1 ? "bg-chip font-medium" : "text-muted"}`}
              onClick={() => onFloor(1)}
            >
              First Floor
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => downloadSvg(`${stem}-plan.svg`, svg)}>
            <Download /> Download SVG
          </Button>
          <Button variant="secondary" size="sm" onClick={() => window.print()}>
            <Printer /> Print / PDF
          </Button>
        </div>
      </div>

      {/* One white drawing sheet, like paper on a desk. */}
      <div className="flex min-h-0 flex-1 justify-center overflow-auto rounded-xl border border-border bg-neutral-100 p-4 shadow-sm">
        <div
          className="flex h-fit w-full max-w-[820px] items-center justify-center bg-white shadow-md"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>
    </div>
  );
}
