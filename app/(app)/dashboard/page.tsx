import Link from "next/link";

import { requireUser } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { careerProfileSchema } from "@/lib/types";

export default async function DashboardPage() {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const [{ data: memory }, { data: resume }] = await Promise.all([
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
  ]);

  const profile = memory
    ? careerProfileSchema.safeParse(memory.profile)
    : null;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Applications</h1>

      {!profile?.success ? (
        <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-5">
          <h2 className="text-sm font-semibold">Set up your career memory</h2>
          <p className="text-sm text-gray-600">
            Upload your resume once so future applications can be tailored to
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
        <div className="space-y-3 rounded-lg border border-gray-200 p-5">
          <p className="text-sm text-gray-700">
            Career memory is set up
            {profile.data.roles[0]?.title
              ? ` — most recent role: ${profile.data.roles[0].title}`
              : ""}
            .
          </p>
          <div className="flex flex-wrap gap-2">
            {resume ? (
              <Link
                href={`/resume/${resume.id}`}
                className="inline-block rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white"
              >
                Open resume builder
              </Link>
            ) : null}
            <Link
              href="/onboarding"
              className="inline-block rounded-md border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Re-upload resume
            </Link>
          </div>
          <p className="text-sm text-gray-500">
            Applications and tailoring land in Phase 4.
          </p>
        </div>
      )}
    </div>
  );
}
