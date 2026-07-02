"use client";

import Link from "next/link";
import { useState } from "react";

import { buttonClass, cn } from "@/components/ui";
import type { ApplicationStatus } from "@/lib/supabase/types";

import { Pipeline, type Filter } from "./pipeline";
import { RecentActivity, type ActivityItem } from "./recent-activity";
import { STAGES, STATUS_META } from "./status";

export interface AppRow {
  id: string;
  company: string;
  role_title: string;
  status: ApplicationStatus;
}

export function ApplicationsBoard({
  applications,
  activity,
}: {
  applications: AppRow[];
  activity: ActivityItem[];
}) {
  const [filter, setFilter] = useState<Filter>("all");

  const counts = STAGES.reduce<Record<ApplicationStatus, number>>((acc, s) => {
    acc[s] = applications.filter((a) => a.status === s).length;
    return acc;
  }, {} as Record<ApplicationStatus, number>);

  const visible =
    filter === "all"
      ? applications
      : applications.filter((a) => a.status === filter);

  return (
    <div className="space-y-6">
      <Pipeline
        counts={counts}
        total={applications.length}
        active={filter}
        onSelect={setFilter}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {visible.length ? (
            <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-card">
              {visible.map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/applications/${a.id}`}
                    className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-white/5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{a.role_title}</p>
                      <p className="truncate text-xs text-muted">{a.company}</p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2.5 py-1 text-xs capitalize",
                        STATUS_META[a.status].badge,
                      )}
                    >
                      {a.status}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-xl border border-dashed border-line p-8 text-center">
              <p className="text-sm text-muted">
                {filter === "all"
                  ? "No applications yet. Paste a job description to get started."
                  : `No applications in "${STATUS_META[filter].label}".`}
              </p>
              {filter === "all" ? (
                <Link
                  href="/applications/new"
                  className={buttonClass({ className: "mt-4" })}
                >
                  New application
                </Link>
              ) : null}
            </div>
          )}
        </div>

        <RecentActivity items={activity} />
      </div>
    </div>
  );
}
