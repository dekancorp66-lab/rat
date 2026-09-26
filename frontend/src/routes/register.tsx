import { useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { useSimpleAuth } from "@/lib/simple-auth/context";
import { AuthApiError } from "@/lib/simple-auth/client";

export const Route = createFileRoute("/register")({ component: RegisterPage });

function PwdToggle({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-subtle hover:text-muted"
      aria-label={show ? "Hide password" : "Show password"}
    >
      {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
    </button>
  );
}

function RegisterPage() {
  const { register } = useSimpleAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    confirm_password: "",
  });
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm_password) {
      setError("Passwords do not match. Please check again.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }
    if (!agreed) {
      setError("Please accept the Terms and Conditions before continuing.");
      return;
    }
    setLoading(true);
    try {
      await register({
        full_name: form.full_name,
        email: form.email,
        phone: form.phone,
        password: form.password,
      });
      navigate({ to: "/anza" });
    } catch (err) {
      setError(
        err instanceof AuthApiError
          ? err.message
          : "Unable to create your account. Check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Welcome to JengaAI"
      title="Create your account"
      lede="Sign up to plan, estimate, and build your home with AI support."
      heroImage="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=1000&fit=crop&auto=format"
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-primary hover:text-primary-hover">
            Sign in here
          </Link>
        </>
      }
    >
      {error ? (
        <div className="mb-6 rounded-lg border border-primary/20 bg-primary-soft px-4 py-3 text-xs text-primary">
          {error}
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label htmlFor="full_name">
            Full name <span className="text-primary">*</span>
          </Label>
          <Input
            id="full_name"
            required
            autoComplete="name"
            placeholder="Mfano: Asha Mwakalinga"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            <Label htmlFor="phone">
              Phone number <span className="text-primary">*</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              required
              autoComplete="tel"
              placeholder="0712 345 678"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
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
              autoComplete="new-password"
              placeholder="Herufi 8 au zaidi"
              className="pr-11"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <PwdToggle show={showPwd} onToggle={() => setShowPwd((v) => !v)} />
          </div>
        </div>
        <div>
          <Label htmlFor="confirm_password">
            Confirm password <span className="text-primary">*</span>
          </Label>
          <div className="relative">
            <Input
              id="confirm_password"
              type={showConfirm ? "text" : "password"}
              required
              autoComplete="new-password"
              placeholder="Andika nywila tena"
              className="pr-11"
              value={form.confirm_password}
              onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
            />
            <PwdToggle show={showConfirm} onToggle={() => setShowConfirm((v) => !v)} />
          </div>
        </div>
        <label className="flex items-start gap-2 pt-1 text-sm text-muted">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 size-4 rounded border-border accent-primary"
          />
          <span>
            I agree to JengaAI&apos;s <a href="#" className="text-primary hover:text-primary-hover">Terms and Conditions</a>.
          </span>
        </label>
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </AuthShell>
  );
}
