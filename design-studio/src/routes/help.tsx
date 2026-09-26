import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { AppHeader } from "@/components/app-header";

export const Route = createFileRoute("/help")({ component: HelpPage });

function HelpPage() {
  return (
    <div className="min-h-dvh bg-bg">
      <AppHeader />
      <main className="mx-auto max-w-2xl px-4 py-14">
        <h1 className="font-display text-4xl">How Wadi works</h1>
        <p className="mt-4 text-muted">
          Wadi is a live home configurator. Every control rewrites the same model, so the 3D house, floor
          plans, elevations, roof drawing and quantities always agree.
        </p>
        <ol className="mt-8 space-y-6">
          <Step n="1" t="Pick a template">
            Start from the gallery. Family villa, bungalow, cottage, shed retreat — each one is a real
            parametric house, not a mood board.
          </Step>
          <Step n="2" t="Tune the plot and rooms">
            Drag plot width and length, set bedrooms and baths, toggle verandah and passage. Living and
            kitchen widths are proportions of the envelope, so the plan reflows instead of clipping.
          </Step>
          <Step n="3" t="Walk through it">
            In the 3D tab, orbit the house or jump to a front, back, side or top view. Pick any room from
            the Walk menu to step inside — WASD to move, click to look, Esc to leave. Furniture is placed
            from the room type.
          </Step>
          <Step n="4" t="Read the drawings">
            Floor plans dimension themselves. Elevations redraw the facades. Roof details list each
            plane. Quantities price terracotta, flashing, trusses, felt and gutters from the live geometry.
          </Step>
          <Step n="5" t="Save, share, export">
            Save keeps the design on this device. Share copies a link with the full spec. Download DXF
            for CAD, SVG for the plan, CSV for the bill of quantities.
          </Step>
        </ol>
        <Link
          to="/"
          className="mt-10 inline-flex h-11 items-center rounded-full bg-primary px-5 text-sm font-medium text-primary-fg"
        >
          Back to gallery
        </Link>
      </main>
    </div>
  );
}

function Step({ n, t, children }: { n: string; t: string; children: ReactNode }) {
  return (
    <li className="flex gap-4">
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary-soft text-sm text-primary">
        {n}
      </span>
      <div>
        <h2 className="font-medium">{t}</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted">{children}</p>
      </div>
    </li>
  );
}
