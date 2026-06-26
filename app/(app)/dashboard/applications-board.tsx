"use client";

import Link from "next/link";
import { useState } from "react";

import type { ApplicationStatus } from "@/lib/supabase/types";

export interface AppRow {
  id: string;
  company: string;
  role_title: string;
  status: ApplicationStatus;
}

const PIPELINE: ApplicationStatus[] = [
  "saved", "applied", "interviewing", "offer", "accepted", "rejected",
];

const STATUS_TONE: Record<ApplicationStatus, string> = {
  saved: "bg-white/10 text-muted",
  applied: "bg-blue-500/15 text-blue-300",
  interviewing: "bg-amber-500/15 text-amber-300",
  offer: "bg-green-500/15 text-green-400",
  accepted: "bg-green-500/15 text-green-400",
  rejected: "bg-red-500/15 text-red-400",
};

type Filter = ApplicationStatus | "all";

export function ApplicationsBoard({ applications }: { applications: AppRow[] }) {
  const [filter, setFilter] = useState<Filter>("all");

  const counts = PIPELINE.reduce<Record<string, number>>((acc, s) => {
    acc[s] = applications.filter((a) => a.status === s).length;
    return acc;
  }, {});

  const visible =
    filter === "all" ? applications : applications.filter((a) => a.status === filter);

  return (
    <div className="space-y-4">
      {/* Pipeline / filter */}
      <div className="flex flex-wrap gap-2">
        <FilterChip
          label="All"
          count={applications.length}
          active={filter === "all"}
          onClick={() => setFilter("all")}
        />
        {PIPELINE.map((s) => (
          <FilterChip
            key={s}
            label={s}
            count={counts[s]}
            active={filter === s}
            onClick={() => setFilter(s)}
          />
        ))}
      </div>

      {visible.length ? (
        <ul className="divide-y divide-line rounded-lg border border-line">
          {visible.map((a) => (
            <li key={a.id}>
              <Link
                href={`/applications/${a.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-white/5"
              >
                <div>
                  <p className="text-sm font-medium">{a.role_title}</p>
                  <p className="text-xs text-muted">{a.company}</p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs capitalize ${STATUS_TONE[a.status]}`}
                >
                  {a.status}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-lg border border-dashed border-line p-6 text-center text-sm text-muted">
          {filter === "all"
            ? "No applications yet. Paste a job description to get started."
            : `No applications in "${filter}".`}
        </p>
      )}
    </div>
  );
}

function FilterChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs capitalize transition-colors ${
        active
          ? "border-brand-600 bg-brand-600 text-white"
          : "border-line text-muted hover:bg-white/5"
      }`}
    >
      {label}
      <span className={active ? "ml-1 text-white/70" : "ml-1 text-faint"}>{count}</span>
    </button>
  );
}
