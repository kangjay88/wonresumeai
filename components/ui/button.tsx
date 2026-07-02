import type { ButtonHTMLAttributes } from "react";
import { cn } from "./cn";

/** The one place button styling lives. Change a variant here and every
 *  <Button> in the app updates. */
export type ButtonVariant = "primary" | "secondary";
export type ButtonSize = "sm" | "md";

const base =
  "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<ButtonVariant, string> = {
  // Dark navy label on coral — ~5:1 contrast, crisp on the light brand fill.
  primary: "bg-brand-600 text-canvas hover:bg-brand-700",
  // No text color — inherits `ink` from <body>, so a caller can pass
  // e.g. `text-muted` without fighting a hardcoded color.
  secondary: "border border-line hover:bg-white/5",
};

const sizes: Record<ButtonSize, string> = {
  sm: "px-2.5 py-1 text-xs",
  md: "px-4 py-2 text-sm",
};

export interface ButtonStyleProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
}

/** The button class string, so a <Link> styled as a button (Next's <Link>
 *  can't be a <button>) shares the exact same treatment. */
export function buttonClass({
  variant = "primary",
  size = "md",
  fullWidth,
  className,
}: ButtonStyleProps = {}): string {
  return cn(base, variants[variant], sizes[size], fullWidth && "w-full", className);
}

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    ButtonStyleProps {}

export function Button({
  variant,
  size,
  fullWidth,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonClass({ variant, size, fullWidth, className })}
      {...props}
    />
  );
}
