import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHead } from "@/components/app/page-head";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { PRODUCTS } from "@/lib/construction/data";
import { formatTsh } from "@/lib/format";
import { useJenga } from "@/lib/store";

export const Route = createFileRoute("/anza/agiza")({ component: AgizaPage });

function AgizaPage() {
  const { cart, addToCart, setCartQty, clearCart } = useJenga();
  const [placed, setPlaced] = useState(false);
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("Dodoma");

  const lines = cart
    .map((c) => {
      const p = PRODUCTS.find((x) => x.id === c.productId);
      if (!p) return null;
      return { ...c, product: p, total: p.price * c.qty };
    })
    .filter((x): x is NonNullable<typeof x> => Boolean(x));
  const sum = lines.reduce((n, l) => n + l.total, 0);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHead
        title="Agiza Vifaa"
        lede="Nunua vifaa kutoka kwa wazalishaji waliothibitishwa. Oda inatumwa kwa mshirika wa mkoa wako — malipo baada ya kuthibitisha stoo."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PRODUCTS.map((p) => (
          <article key={p.id} className="flex flex-col rounded-3xl border border-border bg-surface p-5">
            <p className="text-[11px] font-medium tracking-wide text-primary uppercase">{p.category}</p>
            <h2 className="mt-1 font-sans text-[15px] font-semibold">{p.name}</h2>
            <p className="mt-1 flex-1 text-xs leading-relaxed text-muted">{p.blurb}</p>
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm font-semibold tabular-nums">
                {formatTsh(p.price)} <span className="font-normal text-subtle">/ {p.unit}</span>
              </p>
              <Button size="sm" variant="outline" onClick={() => addToCart(p.id, 1)}>
                Ongeza
              </Button>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-10 rounded-3xl border border-border bg-surface p-5 md:p-6">
        <h2 className="font-sans text-lg font-semibold">Kikapu</h2>
        {lines.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Hakuna vifaa bado. Ongeza kutoka hapo juu au kutoka kikokotoo.</p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {lines.map((l) => (
              <li key={l.productId} className="flex items-center gap-3 py-3 text-sm">
                <span className="flex-1">{l.product.name}</span>
                <input
                  type="number"
                  min={0}
                  value={l.qty}
                  onChange={(e) => setCartQty(l.productId, Number(e.target.value) || 0)}
                  className="h-9 w-20 rounded-lg border border-border px-2 text-sm tabular-nums"
                />
                <span className="w-28 text-right tabular-nums">{formatTsh(l.total, true)}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-right font-display text-2xl font-medium tabular-nums">{formatTsh(sum)}</p>
        {placed ? (
          <p className="mt-4 rounded-2xl bg-primary-soft px-4 py-3 text-sm text-fg">
            Oda imepokelewa. Mshirika wa {city} atakupigia simu kuthibitisha stoo na usafirishaji.
          </p>
        ) : (
          <form
            className="mt-4 grid gap-3 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!lines.length) return;
              setPlaced(true);
              clearCart();
              toast.success("Oda imetumwa.");
            }}
          >
            <div>
              <Label htmlFor="phone">Simu</Label>
              <Input
                id="phone"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+255 7…"
              />
            </div>
            <div>
              <Label htmlFor="city">Mji wa kujifungua</Label>
              <Input id="city" required value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <Button type="submit" className="sm:col-span-2" disabled={!lines.length}>
              Weka oda
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
