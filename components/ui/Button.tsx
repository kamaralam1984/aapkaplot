"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "soft";
type Size = "sm" | "md" | "lg" | "xl";

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-brand-gradient text-white shadow-glow hover:shadow-lift hover:brightness-[1.04] active:brightness-95",
  secondary:
    "bg-ink-900 text-white shadow-soft hover:bg-ink-800 active:bg-ink-900",
  outline:
    "border border-brand-500/40 text-brand-700 bg-white hover:bg-brand-50/60 hover:border-brand-500 shadow-soft",
  ghost:
    "text-ink-700 hover:bg-ink-100/70",
  soft:
    "bg-brand-50 text-brand-700 hover:bg-brand-100/70",
};

const sizeStyles: Record<Size, string> = {
  sm: "h-9 px-3.5 text-[13px] gap-1.5 rounded-lg",
  md: "h-11 px-5 text-sm gap-2 rounded-xl",
  lg: "h-12 px-6 text-[15px] gap-2 rounded-xl",
  xl: "h-14 px-7 text-base gap-2.5 rounded-2xl",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      iconLeft,
      iconRight,
      className,
      children,
      ...props
    },
    ref
  ) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center font-semibold transition-all duration-200 select-none",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {iconLeft && <span className="shrink-0">{iconLeft}</span>}
      {children}
      {iconRight && <span className="shrink-0">{iconRight}</span>}
    </button>
  )
);
Button.displayName = "Button";
