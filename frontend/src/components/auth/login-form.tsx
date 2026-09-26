import { useState, type FormEvent } from "react";
import { Apple, LockKeyhole, UserRound } from "lucide-react";

type LoginValues = {
  username: string;
  password: string;
};

type LoginFormProps = {
  onSubmit?: (values: LoginValues) => void;
};

export function LoginForm({ onSubmit }: LoginFormProps) {
  const [values, setValues] = useState<LoginValues>({ username: "", password: "" });
  const [rememberMe, setRememberMe] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit?.(values);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#e0e8f6] px-4 py-8 text-[#17243c]">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-[380px] rounded-[28px] bg-[#e0e8f6] p-7 shadow-[8px_8px_16px_rgba(0,0,0,0.05),-8px_-8px_16px_rgba(255,255,255,0.8)] sm:p-9"
      >
        <div className="mb-7 text-center">
          <div className="mx-auto mb-5 flex size-[76px] items-center justify-center rounded-full bg-[#e0e8f6] text-[#6f86b7] shadow-[inset_5px_5px_10px_rgba(0,0,0,0.08),inset_-5px_-5px_10px_rgba(255,255,255,0.9)]">
            <UserRound className="size-9" strokeWidth={1.6} aria-hidden="true" />
          </div>
          <h1 className="font-sans text-3xl font-bold tracking-tight">Login</h1>
          <p className="mt-1 text-sm text-[#71809a]">Welcome back! Please sign in</p>
        </div>

        <div className="space-y-4">
          <label className="relative block">
            <span className="sr-only">Username</span>
            <UserRound
              className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-[#7e91b4]"
              strokeWidth={1.8}
              aria-hidden="true"
            />
            <input
              type="text"
              name="username"
              autoComplete="username"
              placeholder="Username"
              value={values.username}
              onChange={(event) => setValues({ ...values, username: event.target.value })}
              required
              className="h-12 w-full rounded-xl border-0 bg-[#e0e8f6] pl-12 pr-4 text-sm text-[#17243c] placeholder:text-[#8190a8] outline-none shadow-[inset_4px_4px_9px_rgba(0,0,0,0.08),inset_-4px_-4px_9px_rgba(255,255,255,0.85)] transition-shadow focus:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.12),inset_-2px_-2px_5px_rgba(255,255,255,0.85)]"
            />
          </label>

          <label className="relative block">
            <span className="sr-only">Password</span>
            <LockKeyhole
              className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-[#7e91b4]"
              strokeWidth={1.8}
              aria-hidden="true"
            />
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              placeholder="Password"
              value={values.password}
              onChange={(event) => setValues({ ...values, password: event.target.value })}
              required
              className="h-12 w-full rounded-xl border-0 bg-[#e0e8f6] pl-12 pr-4 text-sm text-[#17243c] placeholder:text-[#8190a8] outline-none shadow-[inset_4px_4px_9px_rgba(0,0,0,0.08),inset_-4px_-4px_9px_rgba(255,255,255,0.85)] transition-shadow focus:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.12),inset_-2px_-2px_5px_rgba(255,255,255,0.85)]"
            />
          </label>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 text-xs">
          <label className="flex items-center gap-2 text-[#61708b]">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
              className="size-4 accent-[#6b83b8]"
            />
            Remember me
          </label>
          <a href="#forgot-password" className="font-medium text-[#466da8] hover:text-[#2e568f]">
            Forgot Password?
          </a>
        </div>

        <button
          type="submit"
          className="mt-6 h-12 w-full rounded-xl bg-[#e0e8f6] text-sm font-semibold text-[#263b61] shadow-[5px_5px_10px_rgba(0,0,0,0.08),-5px_-5px_10px_rgba(255,255,255,0.85)] transition-[box-shadow,transform] hover:text-[#31558d] active:translate-y-px active:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.1),inset_-4px_-4px_8px_rgba(255,255,255,0.85)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#466da8]"
        >
          Sign In
        </button>

        <div className="my-6 flex items-center gap-3 text-xs text-[#8190a8]">
          <span className="h-px flex-1 bg-[#c9d4e8]" />
          <span>or continue with</span>
          <span className="h-px flex-1 bg-[#c9d4e8]" />
        </div>

        <div className="flex justify-center gap-5">
          <button
            type="button"
            aria-label="Continue with Google"
            className="flex size-12 items-center justify-center rounded-full bg-[#e0e8f6] text-lg font-bold text-[#4285f4] shadow-[5px_5px_10px_rgba(0,0,0,0.08),-5px_-5px_10px_rgba(255,255,255,0.85)] transition-shadow active:shadow-[inset_3px_3px_7px_rgba(0,0,0,0.1),inset_-3px_-3px_7px_rgba(255,255,255,0.85)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#466da8]"
          >
            <span aria-hidden="true">G</span>
          </button>
          <button
            type="button"
            aria-label="Continue with Apple"
            className="flex size-12 items-center justify-center rounded-full bg-[#e0e8f6] text-[#17243c] shadow-[5px_5px_10px_rgba(0,0,0,0.08),-5px_-5px_10px_rgba(255,255,255,0.85)] transition-shadow active:shadow-[inset_3px_3px_7px_rgba(0,0,0,0.1),inset_-3px_-3px_7px_rgba(255,255,255,0.85)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#466da8]"
          >
            <Apple className="size-5" fill="currentColor" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Continue with Facebook"
            className="flex size-12 items-center justify-center rounded-full bg-[#e0e8f6] text-lg font-bold text-[#1877f2] shadow-[5px_5px_10px_rgba(0,0,0,0.08),-5px_-5px_10px_rgba(255,255,255,0.85)] transition-shadow active:shadow-[inset_3px_3px_7px_rgba(0,0,0,0.1),inset_-3px_-3px_7px_rgba(255,255,255,0.85)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#466da8]"
          >
            <span aria-hidden="true">f</span>
          </button>
        </div>
      </form>
    </main>
  );
}
