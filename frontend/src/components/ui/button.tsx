import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium transition-colors duration-150 ease-out active:not-disabled:scale-[0.96] disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-fg hover:bg-primary-hover shadow-sm",
        outline:
          "bg-surface text-fg border border-border hover:bg-bg-warm",
        ghost: "bg-transparent text-fg hover:bg-bg-warm",
        ink: "bg-ink text-primary-fg hover:bg-fg",
        soft: "bg-primary-soft text-primary hover:bg-primary hover:text-primary-fg",
      },
      size: {
        sm: "h-9 px-4 text-sm rounded-full",
        md: "h-11 px-5 text-sm rounded-full",
        lg: "h-12 px-6 text-[15px] rounded-full",
        icon: "size-10 rounded-full",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export function Button({
  className,
  variant,
  size,
  asChild,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
}

export { buttonVariants };
