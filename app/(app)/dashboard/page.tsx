import Link from "next/link";

import { requireUser } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ApplicationStatus } from "@/lib/supabase/types";
import { careerProfileSchema } from "@/lib/types";

const STATUS_TONE: Record<ApplicationStatus, string> = {
  saved: "bg-gray-100 text-gray-600",
  applied: "bg-blue-100 text-blue-700",
  interviewing: "bg-amber-100 text-amber-700",
  offer: "bg-green-100 text-green-700",
  accepted: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-600",
};

export default async function DashboardPage() {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const [{ data: memory }, { data: resume }, { data: applications }] =
    await Promise.all([
      supabase
        .from("career_memory")
        .select("profile")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("base_resumes")
        .select("id, name")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("applications")
        .select("id, company, role_title, status, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

  const profile = memory ? careerProfileSchema.safeParse(memory.profile) : null;
  const ready = Boolean(profile?.success);
  const recentRole =
    profile?.success ? profile.data.roles[0]?.title ?? "" : "";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Applications</h1>
        {ready ? (
          <Link
            href="/applications/new"
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white"
          >
            New application
          </Link>
        ) : null}
      </div>

      {!ready ? (
        <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-5">
          <h2 className="text-sm font-semibold">Set up your career memory</h2>
          <p className="text-sm text-gray-600">
            Upload your resume once so applications can be scored and tailored to
            each job description.
          </p>
          <Link
            href="/onboarding"
            className="inline-block rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white"
          >
            Start onboarding
          </Link>
        </div>
      ) : (
        <>
          {/* Career memory summary */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 p-4 text-sm">
            <span className="text-gray-600">
              Career memory ready{recentRole ? ` — ${recentRole}` : ""}
            </span>
            <div className="flex gap-2">
              {resume ? (
                <Link href={`/resume/${resume.id}`} className="text-gray-700 underline">
                  Resume builder
                </Link>
              ) : null}
              <Link href="/onboarding" className="text-gray-500 underline">
                Re-upload
              </Link>
            </div>
          </div>

          {/* Applications list */}
          {applications && applications.length ? (
            <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200">
              {applications.map((a) => (
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
                      className={`rounded-full px-2.5 py-1 text-xs capitalize ${
                        STATUS_TONE[a.status as ApplicationStatus]
                      }`}
                    >
                      {a.status}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
              No applications yet. Paste a job description to get started.
            </p>
          )}
        </>
      )}
    </div>
  );
}
