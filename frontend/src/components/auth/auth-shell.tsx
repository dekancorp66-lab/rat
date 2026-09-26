import type { ReactNode } from "react";
import { UserRound } from "lucide-react";
import { Logo } from "@/components/logo";

/**
 * Shared neumorphic frame for /login and /register.
 */
export function AuthShell({
  eyebrow,
  title,
  lede,
  children,
  footer,
  heroImage: _heroImage,
}: {
  eyebrow: string;
  title: string;
  lede: string;
  children: ReactNode;
  footer: ReactNode;
  heroImage: string;
}) {
  return (
    <div className="auth-neumorphic flex min-h-[100svh] items-start justify-center overflow-y-auto bg-[#F8F7F2] px-3 py-4 text-[#17243c] sm:items-center sm:px-4 sm:py-8">
      <div className="my-auto w-full max-w-[480px] min-w-0 rounded-[28px] bg-[#F8F7F2] p-5 shadow-[8px_8px_16px_rgba(0,0,0,0.05),-8px_-8px_16px_rgba(255,255,255,0.8)] sm:p-9">
        <div className="mb-7 text-center">
          <Logo to="/" />
          <div className="mx-auto mb-5 mt-6 flex size-[76px] items-center justify-center rounded-full bg-[#e0e8f6] text-[#6f86b7] shadow-[inset_5px_5px_10px_rgba(0,0,0,0.08),inset_-5px_-5px_10px_rgba(255,255,255,0.9)]">
            <UserRound className="size-9" strokeWidth={1.6} aria-hidden="true" />
          </div>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-[#6f86b7]">{eyebrow}</p>
          <h1 className="font-sans text-3xl font-bold tracking-tight text-[#17243c]">{title}</h1>
          <p className="mt-1 text-sm text-[#71809a]">{lede}</p>
        </div>

        {children}

        <p className="mt-6 text-center text-sm text-[#71809a]">{footer}</p>
      </div>
    </div>
  );
}
