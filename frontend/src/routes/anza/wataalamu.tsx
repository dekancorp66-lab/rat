import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHead } from "@/components/app/page-head";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { EXPERTS } from "@/lib/construction/data";
import { useJenga } from "@/lib/store";

export const Route = createFileRoute("/anza/wataalamu")({ component: ExpertsPage });

function ExpertsPage() {
  const addBooking = useJenga((s) => s.addBooking);
  const bookings = useJenga((s) => s.bookings);
  const [expertId, setExpertId] = useState<string>(EXPERTS[0].id);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [message, setMessage] = useState("");

  return (
    <div className="mx-auto max-w-5xl">
      <PageHead
        title="Ongea na Mtaalamu"
        lede="Unganishwa na wasanifu, wahandisi na QS waliothibitishwa nchini kwa ukaguzi wa ramani, msingi au finishes."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {EXPERTS.map((e) => (
          <button
            key={e.id}
            type="button"
            onClick={() => setExpertId(e.id)}
            className={`rounded-3xl border p-5 text-left transition-colors ${
              expertId === e.id ? "border-primary bg-primary-soft" : "border-border bg-surface"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-full bg-ink text-sm font-semibold text-primary-fg">
                {e.initials}
              </span>
              <div>
                <p className="font-semibold">{e.name}</p>
                <p className="text-xs text-muted">
                  {e.title} · {e.city}
                </p>
              </div>
            </div>
            <p className="mt-3 text-sm text-muted">{e.focus}</p>
            <p className="mt-2 text-xs font-medium text-primary">
              {e.years} miaka · {e.rate}
            </p>
          </button>
        ))}
      </div>
      <form
        className="mt-8 max-w-xl space-y-3 rounded-3xl border border-border bg-surface p-5"
        onSubmit={(e) => {
          e.preventDefault();
          addBooking({ expertId, name, phone, city, message });
          toast.success("Ombi limehifadhiwa. Tutakufikishia kwa mtaalamu aliyechaguliwa.");
          setMessage("");
        }}
      >
        <h2 className="font-sans text-base font-semibold">Omba ukaguzi</h2>
        <div>
          <Label htmlFor="n">Jina</Label>
          <Input id="n" required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="p">Simu</Label>
          <Input id="p" required value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="c">Mji wa mradi</Label>
          <Input id="c" required value={city} onChange={(e) => setCity(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="m">Ujumbe</Label>
          <Textarea
            id="m"
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Eleza hatua ya ujenzi na unachohitaji kukaguliwa…"
          />
        </div>
        <Button type="submit">Tuma ombi</Button>
        <p className="text-xs text-muted">
          Ombi linahifadhiwa kwenye kifaa chako. Mtandao wa wataalamu utawasiliana nawe kwa simu uliyotoa.
        </p>
      </form>
      {bookings.length ? (
        <div className="mt-8">
          <h2 className="font-sans text-sm font-semibold">Maombi yako</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {bookings.map((b) => {
              const ex = EXPERTS.find((e) => e.id === b.expertId);
              return (
                <li key={b.id} className="rounded-2xl border border-border bg-surface px-4 py-3">
                  {ex?.name} · {b.city} · {b.phone}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
