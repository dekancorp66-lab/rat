import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/anza/wadi")({ component: WadiPage });

function WadiPage() {
  return (
    <div className="-mx-4 -my-6 flex min-h-[calc(100vh-3.5rem)] flex-col lg:-mx-8 lg:-my-8">
      <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 lg:px-6">
        <div>
          <h1 className="text-base font-semibold text-fg">Design</h1>
          <p className="text-xs text-muted">Buni, hariri na tazama nyumba yako katika 2D na 3D.</p>
        </div>
        <a
          href="/design/index.html"
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-fg hover:bg-bg-warm"
        >
          Fungua Design kwenye dirisha jipya
        </a>
      </div>
      <iframe
        title="JengaAI Design studio"
        src="/design/index.html"
        className="min-h-[calc(100vh-7.5rem)] w-full flex-1 border-0 bg-white"
      />
    </div>
  );
}
