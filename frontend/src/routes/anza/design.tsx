import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/anza/design")({ component: DesignPage });

const DESIGN_STUDIO_URL = import.meta.env.VITE_DESIGN_STUDIO_URL ?? "http://localhost:8082";

function DesignPage() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <iframe title="JengaAI Design studio" src={DESIGN_STUDIO_URL} className="w-full flex-1 border-0 bg-white" />
    </div>
  );
}