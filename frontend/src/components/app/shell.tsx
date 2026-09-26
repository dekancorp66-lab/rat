import { useEffect, useState } from "react";
import { Link, Navigate, Outlet, useRouterState } from "@tanstack/react-router";
import {
  Home,
  Menu,
  MessageSquare,
  MoreVertical,
  Package,
  Palette,
  Receipt,
  Scale,
  ShoppingCart,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { useJenga } from "@/lib/store";
import { useSimpleAuth } from "@/lib/simple-auth/context";
import { toast } from "sonner";

const NAV = [
  { to: "/anza", label: "Chat", icon: MessageSquare },
  { to: "/anza/mshauri", label: "Advisor", icon: Home },
  { to: "/anza/design", label: "Design", icon: Home },
  { to: "/anza/gharama", label: "Costs", icon: Receipt },
  { to: "/anza/vifaa", label: "Materials", icon: Package },
  { to: "/anza/interior", label: "Interior", icon: Palette },
  { to: "/anza/sheria", label: "Legal", icon: Scale },
  { to: "/anza/agiza", label: "Orders", icon: ShoppingCart },
  { to: "/anza/wataalamu", label: "Experts", icon: Users },
] as const;

/** Gate every /anza/* route behind a real (email/password) session. */
export function AppShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, isLoading } = useSimpleAuth();

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-bg text-sm text-muted">
        Loading…
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" search={{ redirect: pathname }} />;
  }
  return <AppShellInner />;
}

function AppShellInner() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const searchStr = useRouterState({ select: (s) => s.location.searchStr });
  const { premium, setPremium, cart } = useJenga();
  const [open, setOpen] = useState(false);
  const [showDashboard, setShowDashboard] = useState(true);
  const cartCount = cart.reduce((n, c) => n + c.qty, 0);

  useEffect(() => {
    const raw = searchStr.startsWith("?") ? searchStr.slice(1) : searchStr;
    const q = new URLSearchParams(raw);
    if (q.get("upgrade") === "1" && !useJenga.getState().premium) {
      setPremium(true);
      toast.success("Premium has been enabled on this device.");
    }
  }, [searchStr, setPremium]);

  return (
    <div className="flex min-h-screen bg-bg">
      {showDashboard ? (
        <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-border bg-surface lg:flex">
          <div className="flex h-16 items-center justify-between px-4">
            <Logo to="/anza" />
            <button
              type="button"
              className="grid size-8 place-items-center rounded-full text-muted hover:bg-bg-warm hover:text-fg"
              aria-label="Hide dashboard"
              title="Hide dashboard"
              onClick={() => setShowDashboard(false)}
            >
              <MoreVertical className="size-4" />
            </button>
          </div>
          <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-4">
            {NAV.map((item) => {
              const active =
                item.to === "/anza" ? pathname === "/anza" : pathname.startsWith(item.to);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium",
                    active ? "bg-primary-soft text-primary" : "text-muted hover:bg-bg-warm hover:text-fg",
                  )}
                >
                  <Icon className="size-4" strokeWidth={1.8} />
                  {item.label}
                  {item.to === "/anza/agiza" && cartCount > 0 ? (
                    <span className="ml-auto rounded-full bg-primary px-1.5 text-[10px] text-primary-fg">
                      {cartCount}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-border p-3">
            {premium ? (
              <div className="flex items-center gap-2 rounded-xl bg-ink px-3 py-2 text-xs text-primary-fg">
                <Sparkles className="size-3.5 text-primary" />
                Premium
              </div>
            ) : (
              <Button size="sm" className="w-full" onClick={() => { setPremium(true); toast.success("Welcome to Premium."); }}>
                Upgrade to Premium
              </Button>
            )}
          </div>
        </aside>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-bg/95 px-4 backdrop-blur lg:h-16 lg:px-6">
          <div className="flex items-center gap-2 lg:hidden">
            <button
              type="button"
              className="grid size-10 place-items-center rounded-full"
              aria-label="Menyu"
              onClick={() => setOpen(true)}
            >
              <Menu className="size-5" />
            </button>
            <Logo to="/anza" />
          </div>
          <div className="flex items-center gap-1">
            <Button asChild variant="ghost" size="sm">
              <Link to="/">Home</Link>
            </Button>
            {!showDashboard ? (
              <button
                type="button"
                className="grid size-9 place-items-center rounded-full border border-border bg-surface text-fg hover:bg-bg-warm"
                onClick={() => setShowDashboard(true)}
                aria-label="Show dashboard"
                title="Show dashboard"
              >
                <MoreVertical className="size-4" />
              </button>
            ) : null}
          </div>
        </header>
        <main className="flex flex-1 flex-col overflow-hidden">
          <Outlet />
        </main>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-ink/40"
            aria-label="Funga"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-surface shadow-xl">
            <div className="flex h-14 items-center justify-between px-4">
              <Logo to="/anza" />
              <button type="button" className="grid size-10 place-items-center" onClick={() => setOpen(false)}>
                <X className="size-5" />
              </button>
            </div>
            <nav className="flex-1 space-y-0.5 overflow-y-auto px-2">
              {NAV.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-fg"
                  >
                    <Icon className="size-4 text-primary" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      ) : null}
    </div>
  );
}