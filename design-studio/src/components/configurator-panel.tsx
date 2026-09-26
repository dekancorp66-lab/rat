import { ChevronLeft, Download, MoreVertical, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadText, estimateCsv, houseToDxf, specToJson } from "@/lib/house/export";
import { ROOF_LABEL } from "@/lib/house/templates";
import type { HouseSpec, RoofStyle, ViewTab } from "@/lib/house/types";
import { cn } from "@/lib/utils";

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (n: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <label className="block py-2.5">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className="text-sm">{label}</span>
        <span className="text-sm text-muted tabular-nums">
          {Number.isInteger(step) ? value : value.toFixed(1)} {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="range-terra"
        style={{ ["--pct" as string]: `${pct}%` }}
      />
    </label>
  );
}

function Segmented({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: number;
  options: number[];
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <span className="text-sm">{label}</span>
      <div className="flex gap-1">
        {options.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={cn(
              "size-8 rounded-full text-sm",
              value === n ? "bg-primary text-primary-fg" : "text-muted hover:bg-chip",
            )}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 py-2.5 text-sm">
      {label}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 rounded-full transition-colors duration-[var(--motion-quick)]",
          checked ? "bg-primary" : "bg-border-strong",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 size-5 rounded-full bg-surface shadow-sm transition-transform duration-[var(--motion-fast)]",
            checked && "translate-x-5",
          )}
        />
      </button>
    </label>
  );
}

export function ConfiguratorPanel({
  spec,
  onChange,
  tab,
  onBack,
  onHide,
}: {
  spec: HouseSpec;
  onChange: (patch: Partial<HouseSpec>) => void;
  tab: ViewTab;
  onBack: () => void;
  onHide: () => void;
}) {
  const fileStem = spec.name.replace(/\s+/g, "-").toLowerCase();
  const hint =
    tab === "plans"
      ? {
          kicker: "Floor plan active",
          body: "Walls, door swings, windows and dimensions follow the sliders. Download SVG or print to PDF.",
        }
      : tab === "elevations"
        ? {
            kicker: "Elevations active",
            body: "Facades redraw with the roof style. Download DXF for CAD, or JSON to reopen later.",
          }
        : tab === "roof"
          ? {
              kicker: "Roof details",
              body: "Pitch, rise and plane areas follow the roof style and the current plot.",
            }
          : tab === "layout"
            ? {
                kicker: "Layout graph",
                body: "Room adjacency and centre-line dimensions stay in lock-step with the 3D model.",
              }
            : tab === "quantities"
              ? {
                  kicker: "Live takeoff",
                  body: "Every line item is derived from the geometry you are editing — nothing is guessed.",
                }
              : {
                  kicker: "3D model",
                  body: "Orbit the house, hide layers, or enter a room to walk it. Every control below rebuilds the same model.",
                };

  return (
    <aside className="flex h-full min-h-0 w-full flex-col bg-bg">
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <h2 className="text-base font-medium">Configure Your Home</h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onHide}
            className="hidden rounded-full p-2 text-muted hover:bg-chip md:inline-flex"
            aria-label="Hide configurator"
          >
            <MoreVertical className="size-4" />
          </button>
          <button
            type="button"
            onClick={onBack}
            className="rounded-full p-2 text-muted hover:bg-chip md:hidden"
            aria-label="Close configurator"
          >
            <ChevronLeft className="size-4" />
          </button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-8">
        <label className="mb-4 block">
          <span className="text-[11px] tracking-[0.16em] text-muted uppercase">Design name</span>
          <input
            value={spec.name}
            onChange={(e) => onChange({ name: e.target.value })}
            className="mt-1.5 h-10 w-full rounded-sm border border-border bg-surface px-3 text-sm outline-none focus:border-primary"
          />
        </label>

        <div className="mb-5 rounded-md bg-surface p-4">
          <p className="text-[11px] font-medium tracking-[0.16em] text-primary uppercase">{hint.kicker}</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">{hint.body}</p>
          {tab === "elevations" && (
            <div className="mt-4 flex flex-col gap-2">
              <Button
                className="w-full rounded-full"
                onClick={() => downloadText(`${fileStem}.dxf`, houseToDxf(spec, 0), "application/dxf")}
              >
                <Download /> Download CAD (DXF)
              </Button>
              <Button
                variant="secondary"
                className="w-full rounded-full"
                onClick={() => downloadText(`${fileStem}.json`, specToJson(spec), "application/json")}
              >
                <Download /> Save JSON
              </Button>
            </div>
          )}
          {tab === "plans" && (
            <Button variant="secondary" className="mt-4 w-full rounded-full" onClick={() => window.print()}>
              <Printer /> Print plan
            </Button>
          )}
          {tab === "quantities" && (
            <Button
              variant="secondary"
              className="mt-4 w-full rounded-full"
              onClick={() => downloadText(`${fileStem}-bom.csv`, estimateCsv(spec), "text/csv")}
            >
              <Download /> Export CSV
            </Button>
          )}
        </div>

        <p className="text-[11px] tracking-[0.16em] text-muted uppercase">Plot boundary</p>
        <SliderRow
          label="Plot Width"
          value={spec.plotWidth}
          min={24}
          max={80}
          step={1}
          unit="ft"
          onChange={(plotWidth) => onChange({ plotWidth })}
        />
        <SliderRow
          label="Plot Length"
          value={spec.plotLength}
          min={28}
          max={100}
          step={1}
          unit="ft"
          onChange={(plotLength) => onChange({ plotLength })}
        />

        <p className="mt-5 text-[11px] tracking-[0.16em] text-muted uppercase">Rooms & outlines</p>
        <Segmented
          label="Bedrooms"
          value={spec.bedrooms}
          options={[1, 2, 3, 4, 5]}
          onChange={(bedrooms) => onChange({ bedrooms, stories: bedrooms >= 4 ? 2 : spec.stories })}
        />
        <Segmented
          label="Bathrooms"
          value={spec.bathrooms}
          options={[1, 2, 3]}
          onChange={(bathrooms) => onChange({ bathrooms })}
        />
        <Segmented
          label="Storeys"
          value={spec.stories}
          options={[1, 2]}
          onChange={(stories) => onChange({ stories: stories === 2 ? 2 : 1 })}
        />
        <ToggleRow
          label="Include Verandah"
          checked={spec.includeVerandah}
          onChange={(includeVerandah) => onChange({ includeVerandah })}
        />
        <ToggleRow
          label="Include Passage"
          checked={spec.includePassage}
          onChange={(includePassage) => onChange({ includePassage })}
        />

        <p className="mt-5 text-[11px] tracking-[0.16em] text-muted uppercase">Proportional sizes</p>
        <SliderRow
          label="Living Room Width"
          value={spec.livingRoomWidthPct}
          min={28}
          max={70}
          step={1}
          unit="%"
          onChange={(livingRoomWidthPct) => onChange({ livingRoomWidthPct })}
        />
        <SliderRow
          label="Kitchen Width"
          value={spec.kitchenWidthPct}
          min={20}
          max={50}
          step={1}
          unit="%"
          onChange={(kitchenWidthPct) => onChange({ kitchenWidthPct })}
        />
        <SliderRow
          label="Bedroom Size"
          value={spec.bedroomSize}
          min={10}
          max={18}
          step={0.5}
          unit="ft"
          onChange={(bedroomSize) => onChange({ bedroomSize })}
        />

        <p className="mt-5 text-[11px] tracking-[0.16em] text-muted uppercase">Style & walls</p>
        <div className="py-2.5">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="text-sm">Roof Style</span>
            <span className="text-sm text-muted">{ROOF_LABEL[spec.roofStyle]}</span>
          </div>
          <div className="grid grid-cols-4 gap-1">
            {(["hip", "gable", "shed", "flat"] as RoofStyle[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => onChange({ roofStyle: r })}
                className={cn(
                  "rounded-sm py-2 text-xs capitalize",
                  spec.roofStyle === r ? "bg-primary text-primary-fg" : "bg-chip text-muted",
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <SliderRow
          label="Floor Height"
          value={spec.floorHeight}
          min={8}
          max={14}
          step={0.5}
          unit="ft"
          onChange={(floorHeight) => onChange({ floorHeight })}
        />
        <SliderRow
          label="Wall Thickness"
          value={spec.wallThickness}
          min={6}
          max={12}
          step={0.5}
          unit="in"
          onChange={(wallThickness) => onChange({ wallThickness })}
        />
      </div>
    </aside>
  );
}
