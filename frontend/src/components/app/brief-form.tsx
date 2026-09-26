import { FINISH_LEVELS, REGIONS, STOREYS } from "@/lib/construction/data";
import { defaultArea, type Brief } from "@/lib/construction/estimate";
import { Input, Label } from "@/components/ui/input";
import { cn } from "@/lib/cn";

export function BriefForm({
  brief,
  onChange,
}: {
  brief: Brief;
  onChange: (b: Brief) => void;
}) {
  function patch(p: Partial<Brief>) {
    const next = { ...brief, ...p };
    if (p.bedrooms && !p.areaSqm) next.areaSqm = defaultArea(next.bedrooms, next.storeys);
    onChange(next);
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div>
        <Label htmlFor="region">Mkoa</Label>
        <select
          id="region"
          className={cn(
            "h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20",
          )}
          value={brief.region}
          onChange={(e) => patch({ region: e.target.value as Brief["region"] })}
        >
          {REGIONS.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="beds">Vyumba vya kulala</Label>
        <Input
          id="beds"
          type="number"
          min={1}
          max={8}
          value={brief.bedrooms}
          onChange={(e) => patch({ bedrooms: Number(e.target.value) || 1 })}
        />
      </div>
      <div>
        <Label htmlFor="baths">Bafu</Label>
        <Input
          id="baths"
          type="number"
          min={1}
          max={6}
          value={brief.bathrooms}
          onChange={(e) => patch({ bathrooms: Number(e.target.value) || 1 })}
        />
      </div>
      <div>
        <Label htmlFor="storeys">Ghorofa</Label>
        <select
          id="storeys"
          className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm outline-none focus:border-primary"
          value={brief.storeys}
          onChange={(e) => patch({ storeys: Number(e.target.value) as 1 | 2 | 3 })}
        >
          {STOREYS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="area">Eneo (m²)</Label>
        <Input
          id="area"
          type="number"
          min={40}
          max={800}
          value={brief.areaSqm}
          onChange={(e) => patch({ areaSqm: Number(e.target.value) || 40 })}
        />
      </div>
      <div>
        <Label htmlFor="finish">Kiwango cha finishes</Label>
        <select
          id="finish"
          className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm outline-none focus:border-primary"
          value={brief.finish}
          onChange={(e) => patch({ finish: e.target.value as Brief["finish"] })}
        >
          {FINISH_LEVELS.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
