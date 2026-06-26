import Link from "next/link";

import { requireUser } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { careerProfileSchema } from "@/lib/types";

import { ApplicationsBoard, type AppRow } from "./applications-board";

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

          {/* Applications pipeline */}
          <ApplicationsBoard
            applications={(applications ?? []) as AppRow[]}
          />
        </>
      )}
    </div>
  );
}
