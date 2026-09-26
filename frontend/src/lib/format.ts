export function formatTsh(n: number, compact = false): string {
  if (!Number.isFinite(n)) return "TSh —";
  if (compact && Math.abs(n) >= 1_000_000) {
    const m = n / 1_000_000;
    const body = Math.abs(m) >= 10 ? m.toFixed(0) : m.toFixed(1).replace(/\.0$/, "");
    return `TSh ${body}M`;
  }
  return `TSh ${Math.round(n).toLocaleString("en-TZ")}`;
}

export function formatRange(low: number, high: number, compact = true): string {
  return `${formatTsh(low, compact)} – ${formatTsh(high, compact)}`;
}

export function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`;
}
