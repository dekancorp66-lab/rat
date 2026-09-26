import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/anza/interior")({ component: InteriorPage });

// Two separately-deployed apps power this page — neither is a static bundle,
// so both live elsewhere and get embedded via iframe:
//  - openPlan3D: SvelteKit 2D/3D floor plan + furniture editor
//  - roomGPT: Next.js app that AI-redesigns an uploaded photo of a room
// Point these at wherever each is actually running: locally that's each
// app's own dev server; in production, their deployed URLs.
const INTERIOR_STUDIO_URL = import.meta.env.VITE_INTERIOR_STUDIO_URL ?? "http://localhost:5173";
const ROOM_REDESIGN_URL = import.meta.env.VITE_ROOM_REDESIGN_URL ?? "http://localhost:3000";

type Tab = "plan" | "redesign";

function InteriorPage() {
  const [tab, setTab] = useState<Tab>("plan");

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex gap-1 border-b border-border bg-surface px-4 pt-3">
        <TabButton active={tab === "plan"} onClick={() => setTab("plan")}>
          Floor Plan
        </TabButton>
        <TabButton active={tab === "redesign"} onClick={() => setTab("redesign")}>
          AI Redesign
        </TabButton>
      </div>

      {/* Both iframes stay mounted so switching tabs doesn't reload either
         app or lose in-progress work; the inactive one is just hidden. */}
      <div className="relative min-h-0 flex-1">
        <iframe
          title="Interior floor plan studio"
          src={INTERIOR_STUDIO_URL}
          className={`absolute inset-0 h-full w-full border-0 bg-white ${tab === "plan" ? "" : "hidden"}`}
        />
        <iframe
          title="AI room redesign"
          src={ROOM_REDESIGN_URL}
          className={`absolute inset-0 h-full w-full border-0 bg-white ${tab === "redesign" ? "" : "hidden"}`}
        />
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-t-lg px-4 py-2 text-sm font-medium ${
        active ? "bg-bg text-primary" : "text-muted hover:text-fg"
      }`}
    >
      {children}
    </button>
  );
}