import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";

export const Route = createFileRoute("/wasiliana")({ component: ContactPage });

function ContactPage() {
  const [sent, setSent] = useState(false);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSent(true);
    toast.success("Ujumbe umefika. Tutawasiliana nawe.");
  }

  return (
    <div className="min-h-screen bg-bg">
      <SiteHeader solid />
      <article className="mx-auto max-w-xl px-5 py-16 md:px-8">
        <h1 className="font-display text-4xl font-medium">Wasiliana</h1>
        <p className="mt-3 text-sm text-muted">
          Dodoma, Tanzania · info@jengaai.co.tz · +255 700 000 000
        </p>
        {sent ? (
          <p className="mt-8 rounded-3xl bg-primary-soft px-5 py-4 text-sm">
            Asante. Timu itakujibu ndani ya siku moja ya kazi.
          </p>
        ) : (
          <form className="mt-8 space-y-4" onSubmit={onSubmit}>
            <div>
              <Label htmlFor="name">Jina</Label>
              <Input id="name" required name="name" />
            </div>
            <div>
              <Label htmlFor="email">Barua pepe au simu</Label>
              <Input id="email" required name="email" />
            </div>
            <div>
              <Label htmlFor="msg">Ujumbe</Label>
              <Textarea id="msg" required name="msg" />
            </div>
            <Button type="submit">Tuma</Button>
          </form>
        )}
      </article>
      <SiteFooter />
    </div>
  );
}
