import Link from "next/link";

import { Card, cn } from "@/components/ui";

export type ActivityKind = "created" | "resume" | "cover_letter";

export interface ActivityItem {
  id: string;
  kind: ActivityKind;
  appId: string;
  company: string;
  role: string;
  timeAgo: string;
  version?: number;
  score?: number | null;
}

const KIND_META: Record<ActivityKind, { label: string; dot: string }> = {
  created: { label: "Added application", dot: "bg-white/40" },
  resume: { label: "Tailored resume", dot: "bg-brand-500" },
  cover_letter: { label: "Cover letter", dot: "bg-accent-400" },
};

export function RecentActivity({ items }: { items: ActivityItem[] }) {
  return (
    <Card className="p-4">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
        Recent activity
      </h2>
      {items.length ? (
        <ul className="mt-3 space-y-3">
          {items.map((it) => {
            const meta = KIND_META[it.kind];
            return (
              <li key={it.id}>
                <Link
                  href={`/applications/${it.appId}`}
                  className="group flex gap-3"
                >
                  <span
                    className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", meta.dot)}
                  />
                  <span className="min-w-0">
                    <span className="block text-sm">
                      <span className="font-medium">{meta.label}</span>
                      {it.version ? (
                        <span className="text-muted"> v{it.version}</span>
                      ) : null}
                      {typeof it.score === "number" ? (
                        <span className="text-faint"> · score {it.score}</span>
                      ) : null}
                    </span>
                    <span className="block truncate text-xs text-muted group-hover:text-ink">
                      {it.role} · {it.company}
                    </span>
                    <span className="block text-[11px] text-faint">{it.timeAgo}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted">
          No activity yet. Tailor a resume or write a cover letter to see it here.
        </p>
      )}
    </Card>
  );
}
