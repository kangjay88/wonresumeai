import Link from "next/link";

import { buttonClass, Card } from "@/components/ui";
import { requireUser } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { careerProfileSchema } from "@/lib/types";

import { ApplicationsBoard, type AppRow } from "./applications-board";
import type { ActivityItem, ActivityKind } from "./recent-activity";

/** Relative time, computed at request time (server-rendered, so no client
 *  hydration drift). */
function timeAgo(iso: string): string {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (seconds < 60) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (days < 35) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export default async function DashboardPage() {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const [{ data: memory }, { data: applications }, { data: documents }] =
    await Promise.all([
      supabase
        .from("career_memory")
        .select("profile")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("applications")
        .select("id, company, role_title, status, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("documents")
        .select("application_id, doc_type, version, score, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

  const ready = Boolean(
    memory && careerProfileSchema.safeParse(memory.profile).success
  );

  if (!ready) {
    return (
      <div className="mx-auto max-w-3xl p-6 lg:p-8">
        <Card className="space-y-3 p-6">
          <h2 className="text-base font-semibold">Set up your career memory</h2>
          <p className="text-sm text-muted">
            Upload your resume once so applications can be scored and tailored to
            each job description.
          </p>
          <Link href="/onboarding" className={buttonClass()}>
            Start onboarding
          </Link>
        </Card>
      </div>
    );
  }

  const apps = (applications ?? []) as (AppRow & { created_at: string })[];
  const appById = new Map(apps.map((a) => [a.id, a]));

  // Merge document saves + application-created events into one timeline.
  const events: { at: string; item: Omit<ActivityItem, "timeAgo"> }[] = [];
  for (const d of documents ?? []) {
    const app = appById.get(d.application_id);
    if (!app) continue;
    const score = (d.score as { total?: number } | null)?.total ?? null;
    events.push({
      at: d.created_at,
      item: {
        id: `doc-${d.application_id}-${d.doc_type}-${d.version}`,
        kind: d.doc_type as ActivityKind,
        appId: app.id,
        company: app.company,
        role: app.role_title,
        version: d.version,
        score,
      },
    });
  }
  for (const a of apps) {
    events.push({
      at: a.created_at,
      item: {
        id: `app-${a.id}`,
        kind: "created",
        appId: a.id,
        company: a.company,
        role: a.role_title,
      },
    });
  }
  const activity: ActivityItem[] = events
    .sort((x, y) => y.at.localeCompare(x.at))
    .slice(0, 6)
    .map((e) => ({ ...e.item, timeAgo: timeAgo(e.at) }));

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6 lg:p-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Applications</h1>
          <p className="text-sm text-muted">
            Track, score, and tailor every application.
          </p>
        </div>
        <Link href="/applications/new" className={buttonClass()}>
          New application
        </Link>
      </header>

      <ApplicationsBoard applications={apps} activity={activity} />
    </div>
  );
}
