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
  saved: "bg-gray-100 text-gray-600",
  applied: "bg-blue-100 text-blue-700",
  interviewing: "bg-amber-100 text-amber-700",
  offer: "bg-green-100 text-green-700",
  accepted: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-600",
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
        <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200">
          {visible.map((a) => (
            <li key={a.id}>
              <Link
                href={`/applications/${a.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
              >
                <div>
                  <p className="text-sm font-medium">{a.role_title}</p>
                  <p className="text-xs text-gray-500">{a.company}</p>
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
        <p className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
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
          ? "border-gray-900 bg-gray-900 text-white"
          : "border-gray-300 text-gray-600 hover:bg-gray-50"
      }`}
    >
      {label}
      <span className={active ? "ml-1 text-gray-300" : "ml-1 text-gray-400"}>{count}</span>
    </button>
  );
}
