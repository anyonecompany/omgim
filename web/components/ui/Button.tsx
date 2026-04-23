"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-sm font-semibold transition-colors duration-150 ease-[var(--ease-standard)] disabled:opacity-40 disabled:pointer-events-none select-none";

const variantClass: Record<Variant, string> = {
  primary:
    "bg-brand text-white border border-brand hover:bg-brand-hover active:bg-brand-hover",
  secondary:
    "bg-white text-grey-900 border border-grey-200 hover:border-grey-300",
  ghost:
    "bg-transparent text-brand border border-transparent hover:bg-brand-light",
};

const sizeClass: Record<Size, string> = {
  sm: "h-9 px-3 text-[13px]",
  md: "h-11 px-4 text-[14px]",
  lg: "h-14 px-5 text-[16px]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "primary", size = "md", fullWidth, className, ...props },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          base,
          variantClass[variant],
          sizeClass[size],
          fullWidth && "w-full",
          className,
        )}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
