"use client";

import { useState, useTransition } from "react";

import type { ApplicationStatus } from "@/lib/supabase/types";

import { updateApplicationStatus } from "../actions";

const STATUSES: ApplicationStatus[] = [
  "saved", "applied", "interviewing", "offer", "rejected", "accepted",
];

export function StatusSelect({
  id,
  initial,
}: {
  id: string;
  initial: ApplicationStatus;
}) {
  const [status, setStatus] = useState(initial);
  const [pending, startTransition] = useTransition();

  return (
    <select
      value={status}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value as ApplicationStatus;
        setStatus(next);
        startTransition(async () => {
          const result = await updateApplicationStatus(id, next);
          if (!result.ok) setStatus(initial);
        });
      }}
      className="rounded-md border border-gray-300 px-2 py-1 text-sm capitalize outline-none focus:border-gray-900 disabled:opacity-50"
    >
      {STATUSES.map((s) => (
        <option key={s} value={s} className="capitalize">
          {s}
        </option>
      ))}
    </select>
  );
}
