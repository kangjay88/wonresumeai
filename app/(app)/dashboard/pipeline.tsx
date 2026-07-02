"use client";

import { cn } from "@/components/ui";
import type { ApplicationStatus } from "@/lib/supabase/types";

import { STAGES, STATUS_META } from "./status";

export type Filter = ApplicationStatus | "all";

/** Pipeline at a glance: each stage is a stat cell that doubles as the list
 *  filter. Clicking the active stage clears back to All. */
export function Pipeline({
  counts,
  total,
  active,
  onSelect,
}: {
  counts: Record<ApplicationStatus, number>;
  total: number;
  active: Filter;
  onSelect: (filter: Filter) => void;
}) {
  const max = Math.max(1, ...STAGES.map((s) => counts[s]));

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
      <Cell
        label="All"
        count={total}
        pct={100}
        bar="bg-brand-500"
        text="text-brand-400"
        active={active === "all"}
        onClick={() => onSelect("all")}
      />
      {STAGES.map((s) => (
        <Cell
          key={s}
          label={STATUS_META[s].label}
          count={counts[s]}
          pct={(counts[s] / max) * 100}
          bar={STATUS_META[s].bar}
          text={STATUS_META[s].text}
          active={active === s}
          onClick={() => onSelect(active === s ? "all" : s)}
        />
      ))}
    </div>
  );
}

function Cell({
  label,
  count,
  pct,
  bar,
  text,
  active,
  onClick,
}: {
  label: string;
  count: number;
  pct: number;
  bar: string;
  text: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-xl border bg-card p-3 text-left transition-colors",
        active
          ? "border-brand-500 ring-1 ring-brand-500/40"
          : "border-line hover:border-faint",
      )}
    >
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 text-2xl font-semibold tabular-nums",
          count ? text : "text-faint",
        )}
      >
        {count}
      </p>
      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/10">
        <div className={cn("h-full rounded-full", bar)} style={{ width: `${pct}%` }} />
      </div>
    </button>
  );
}
