import type { HTMLAttributes } from "react";
import { cn } from "./cn";

/** Elevated surface. Padding stays with the caller (sites vary between
 *  p-4 / p-6 / px-4 py-3); the surface treatment is centralized here. */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-xl border border-line bg-card", className)}
      {...props}
    />
  );
}
