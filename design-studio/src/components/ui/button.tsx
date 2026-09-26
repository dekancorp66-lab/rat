import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-[color,background-color,transform,box-shadow] duration-[var(--motion-quick)] ease-[var(--ease-out)] disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-fg hover:bg-primary-hover shadow-sm",
        secondary: "bg-surface text-fg border border-border hover:bg-surface-2",
        ghost: "text-muted hover:text-fg hover:bg-chip",
        outline: "border border-border-strong bg-transparent text-fg hover:bg-surface",
        dark: "bg-overlay text-primary-fg hover:bg-ink",
      },
      size: {
        default: "h-10 px-4 rounded-sm text-sm",
        sm: "h-8 px-3 rounded-xs text-xs",
        lg: "h-12 px-5 rounded-md text-sm",
        icon: "size-9 rounded-sm",
        pill: "h-10 px-5 rounded-full text-sm",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export const Button = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }
>(({ className, variant, size, asChild, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
});
Button.displayName = "Button";
