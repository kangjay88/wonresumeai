"use client";

import Link from "next/link";
import { useState } from "react";

import { cn } from "@/components/ui";
import type { ApplicationStatus } from "@/lib/supabase/types";

import type { AppRow } from "./applications-board";
import { STAGES, STATUS_META } from "./status";

/** Drag-and-drop status board (native HTML5 DnD — no dependency). Drag a card
 *  into another column to change its status; the parent persists the move. */
export function KanbanBoard({
  apps,
  onMove,
}: {
  apps: AppRow[];
  onMove: (id: string, status: ApplicationStatus) => void;
}) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<ApplicationStatus | null>(null);

  function drop(stage: ApplicationStatus) {
    if (dragId) onMove(dragId, stage);
    setDragId(null);
    setOverCol(null);
  }

  return (
    <div className="scrollbar-slim flex gap-3 overflow-x-auto pb-2">
      {STAGES.map((stage) => {
        const items = apps.filter((a) => a.status === stage);
        const meta = STATUS_META[stage];
        const isOver = overCol === stage && dragId !== null;
        return (
          <div
            key={stage}
            onDragOver={(e) => {
              e.preventDefault();
              setOverCol(stage);
            }}
            onDrop={(e) => {
              e.preventDefault();
              drop(stage);
            }}
            className={cn(
              "flex w-64 shrink-0 flex-col rounded-xl border p-2 transition-colors",
              isOver ? "border-brand-500 bg-brand-500/5" : "border-line",
            )}
          >
            <div className="flex items-center justify-between px-2 py-1.5">
              <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
                <span className={cn("h-2 w-2 rounded-full", meta.bar)} />
                {meta.label}
              </span>
              <span className="tabular-nums text-xs text-faint">{items.length}</span>
            </div>

            <div className="flex flex-1 flex-col gap-2 p-1">
              {items.map((a) => (
                <div
                  key={a.id}
                  draggable
                  onDragStart={() => setDragId(a.id)}
                  onDragEnd={() => {
                    setDragId(null);
                    setOverCol(null);
                  }}
                  className={cn(
                    "cursor-grab rounded-lg border border-line bg-card p-3 transition-opacity active:cursor-grabbing",
                    dragId === a.id && "opacity-40",
                  )}
                >
                  <Link
                    href={`/applications/${a.id}`}
                    draggable={false}
                    className="block"
                  >
                    <p className="truncate text-sm font-medium">{a.role_title}</p>
                    <p className="truncate text-xs text-muted">{a.company}</p>
                  </Link>
                </div>
              ))}

              {items.length === 0 ? (
                <p className="rounded-lg border border-dashed border-line px-2 py-6 text-center text-xs text-faint">
                  {isOver ? "Release to move here" : "Empty"}
                </p>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
