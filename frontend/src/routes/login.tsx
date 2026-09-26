import { useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { Eye, EyeOff } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { useSimpleAuth } from "@/lib/simple-auth/context";
import { AuthApiError } from "@/lib/simple-auth/client";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
});

function LoginPage() {
  const { login } = useSimpleAuth();
  const navigate = useNavigate();
  const { redirect } = useSearch({ from: "/login" });

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate({ to: redirect ?? "/anza" });
    } catch (err) {
      setError(
        err instanceof AuthApiError
          ? err.message
          : "Unable to sign in. Check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in to your account"
      lede="Enter your details below to continue planning your construction project."
      heroImage="https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&h=1000&fit=crop&auto=format"
      footer={
        <>
          Don't have an account yet?{" "}
          <Link to="/register" className="font-semibold text-primary hover:text-primary-hover">
            Sign up here
          </Link>
        </>
      }
    >
      {error ? (
        <div className="mb-6 rounded-lg border border-primary/20 bg-primary-soft px-4 py-3 text-xs text-primary">
          {error}
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <Label htmlFor="email">
            Email address <span className="text-primary">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            placeholder="mfano@jengaai.co.tz"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="password">
            Password <span className="text-primary">*</span>
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPwd ? "text" : "password"}
              required
              autoComplete="current-password"
              placeholder="••••••••••"
              className="pr-11"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-subtle hover:text-muted"
              aria-label={showPwd ? "Hide password" : "Show password"}
            >
              {showPwd ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </AuthShell>
  );
}
