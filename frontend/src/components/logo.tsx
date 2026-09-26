import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/cn";

export function Logo({
  className,
  to = "/",
  dark = false,
}: {
  className?: string;
  to?: string;
  dark?: boolean;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "flex shrink-0 items-center",
        dark && "rounded-md bg-white p-1",
        className,
      )}
    >
      <img
        src="/logo.png"
        alt="Jenga AI"
        className="h-10 w-auto max-w-[190px] object-contain"
      />
    </Link>
  );
}
