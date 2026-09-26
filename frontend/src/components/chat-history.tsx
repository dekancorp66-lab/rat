import { MessageSquare, Search, SquarePen } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { authApi, type ConversationSummary } from "@/lib/simple-auth/client";
import { useSimpleAuth } from "@/lib/simple-auth/context";

type Props = {
  activeId?: string;
  refreshKey: number;
  onNew: () => void;
  onSelect: (conversation: ConversationSummary) => void;
};

export function ChatHistory({ activeId, refreshKey, onNew, onSelect }: Props) {
  const { token } = useSimpleAuth();
  const [items, setItems] = useState<ConversationSummary[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    authApi.conversations(token)
      .then((conversations) => { if (!cancelled) { setItems(conversations); setError(false); } })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [token, refreshKey]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return term ? items.filter((item) => item.title.toLowerCase().includes(term)) : items;
  }, [items, query]);

  return (
    <div className="flex h-full flex-col bg-bg-warm/30">
      <div className="border-b border-border p-3">
        <button type="button" onClick={onNew} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-fg hover:bg-surface">
          <SquarePen className="size-4" /> Mazungumzo mapya
        </button>
        <label className="mt-2 flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2">
          <Search className="size-4 text-muted" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tafuta historia..." className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-subtle" />
        </label>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <p className="mb-2 px-3 text-[10px] font-semibold tracking-wider text-subtle uppercase">Historia</p>
        {filtered.map((conversation) => (
          <button key={conversation.id} type="button" onClick={() => onSelect(conversation)} className={`mb-1 flex w-full items-start gap-2 rounded-xl px-3 py-2.5 text-left text-xs hover:bg-surface ${conversation.id === activeId ? "bg-surface text-primary" : "text-fg"}`}>
            <MessageSquare className="mt-0.5 size-3.5 shrink-0" />
            <span className="line-clamp-2">{conversation.title}</span>
          </button>
        ))}
        {!filtered.length && <p className="px-3 text-xs leading-relaxed text-muted">{error ? "Historia haipatikani kwa sasa." : "Mazungumzo yako ya awali yataonekana hapa."}</p>}
      </div>
    </div>
  );
}
