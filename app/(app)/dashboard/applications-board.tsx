"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { buttonClass, cn } from "@/components/ui";
import type { ApplicationStatus } from "@/lib/supabase/types";

import { updateApplicationStatus } from "../applications/actions";
import { KanbanBoard } from "./kanban-board";
import { Pipeline, type Filter } from "./pipeline";
import { RecentActivity, type ActivityItem } from "./recent-activity";
import { STAGES, STATUS_META } from "./status";

export interface AppRow {
  id: string;
  company: string;
  role_title: string;
  status: ApplicationStatus;
}

type View = "list" | "board";

export function ApplicationsBoard({
  applications,
  activity,
}: {
  applications: AppRow[];
  activity: ActivityItem[];
}) {
  const [apps, setApps] = useState(applications);
  const [filter, setFilter] = useState<Filter>("all");
  const [view, setView] = useState<View>("list");
  const [, startTransition] = useTransition();

  const counts = STAGES.reduce<Record<ApplicationStatus, number>>((acc, s) => {
    acc[s] = apps.filter((a) => a.status === s).length;
    return acc;
  }, {} as Record<ApplicationStatus, number>);

  // Optimistically move a card, then persist; revert that card on failure.
  function move(id: string, status: ApplicationStatus) {
    const target = apps.find((a) => a.id === id);
    if (!target || target.status === status) return;
    const prevStatus = target.status;
    setApps((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a)),
    );
    startTransition(async () => {
      const res = await updateApplicationStatus(id, status);
      if (!res.ok) {
        setApps((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status: prevStatus } : a)),
        );
      }
    });
  }

  const visible =
    filter === "all" ? apps : apps.filter((a) => a.status === filter);

  return (
    <div className="space-y-6">
      <Pipeline
        counts={counts}
        total={apps.length}
        active={filter}
        onSelect={view === "list" ? setFilter : undefined}
      />

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">
          {apps.length} application{apps.length === 1 ? "" : "s"}
        </p>
        <ViewToggle view={view} onChange={setView} />
      </div>

      {view === "board" ? (
        <KanbanBoard apps={apps} onMove={move} />
      ) : (
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
                        <p className="truncate text-sm font-medium">
                          {a.role_title}
                        </p>
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
      )}
    </div>
  );
}

function ViewToggle({
  view,
  onChange,
}: {
  view: View;
  onChange: (v: View) => void;
}) {
  return (
    <div className="inline-flex rounded-md border border-line p-0.5">
      {(["list", "board"] as const).map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          aria-pressed={view === v}
          className={cn(
            "rounded px-3 py-1 text-xs font-medium capitalize transition-colors",
            view === v ? "bg-white/10 text-ink" : "text-muted hover:text-ink",
          )}
        >
          {v}
        </button>
      ))}
    </div>
  );
}
