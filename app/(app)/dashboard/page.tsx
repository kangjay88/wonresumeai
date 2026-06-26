import Link from "next/link";

import { requireUser } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ApplicationStatus } from "@/lib/supabase/types";
import { careerProfileSchema } from "@/lib/types";

import { ApplicationsBoard, type AppRow } from "./applications-board";

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-line bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">
        {label}
      </p>
      <p
        className={`mt-1 text-3xl font-semibold ${
          accent ? "text-brand-400" : "text-ink"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

export default async function DashboardPage() {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const [{ data: memory }, { data: applications }] = await Promise.all([
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
  ]);

  const ready = Boolean(
    memory && careerProfileSchema.safeParse(memory.profile).success
  );

  if (!ready) {
    return (
      <div className="mx-auto max-w-3xl p-6 lg:p-8">
        <div className="space-y-3 rounded-xl border border-line bg-card p-6">
          <h2 className="text-base font-semibold">Set up your career memory</h2>
          <p className="text-sm text-muted">
            Upload your resume once so applications can be scored and tailored to
            each job description.
          </p>
          <Link
            href="/onboarding"
            className="inline-block rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Start onboarding
          </Link>
        </div>
      </div>
    );
  }

  const apps = (applications ?? []) as AppRow[];
  const count = (s: ApplicationStatus) => apps.filter((a) => a.status === s).length;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6 lg:p-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Applications</h1>
          <p className="text-sm text-muted">
            Track, score, and tailor every application.
          </p>
        </div>
        <Link
          href="/applications/new"
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          New application
        </Link>
      </header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total" value={apps.length} />
        <StatCard label="Applied" value={count("applied")} />
        <StatCard label="Interviewing" value={count("interviewing")} />
        <StatCard
          label="Offers"
          value={count("offer") + count("accepted")}
          accent
        />
      </div>

      <ApplicationsBoard applications={apps} />
    </div>
  );
}
