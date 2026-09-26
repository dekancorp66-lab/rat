export function PageHead({
  title,
  lede,
}: {
  title: string;
  lede?: string;
}) {
  return (
    <div className="mb-6 max-w-2xl">
      <h1 className="font-display text-3xl font-medium tracking-tight text-fg">{title}</h1>
      {lede ? <p className="mt-2 text-sm leading-relaxed text-muted">{lede}</p> : null}
    </div>
  );
}
