import Link from "next/link";
import { notFound } from "next/navigation";

import { requireUser } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ApplicationStatus } from "@/lib/supabase/types";
import {
  coverLetterContentSchema,
  jdExtractionSchema,
  resumeSectionsSchema,
  reviewResultSchema,
} from "@/lib/types";

import { ApplicationWizard } from "./application-wizard";
import {
  CoverLetterVersionList,
  type CoverLetterVersionItem,
} from "./cover-letter-version-list";
import { StatusSelect } from "./status-select";
import { VersionDiff } from "./version-diff";
import { VersionList, type VersionItem } from "./version-list";

export default async function ApplicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const [{ data: app }, { data: resume }, { data: docs }] = await Promise.all([
    supabase
      .from("applications")
      .select("id, company, role_title, job_description, jd_extraction, review, status, applied_at")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("base_resumes")
      .select("id, sections")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("documents")
      .select("id, version, content, score, created_at, doc_type")
      .eq("user_id", user.id)
      .eq("application_id", id)
      .order("version", { ascending: false }),
  ]);

  if (!app) notFound();

  const jd = app.jd_extraction
    ? jdExtractionSchema.safeParse(app.jd_extraction)
    : null;
  const sections = resume ? resumeSectionsSchema.safeParse(resume.sections) : null;
  const jdData = jd?.success ? jd.data : null;

  // Cached AI rubric (if the review was run before) — re-applied without a
  // fresh Sonnet call.
  const review = app.review ? reviewResultSchema.safeParse(app.review) : null;
  const rubric = review?.success ? review.data : null;

  const versions: VersionItem[] = (docs ?? [])
    .filter((d) => d.doc_type === "resume")
    .map((d) => {
      const parsed = resumeSectionsSchema.safeParse(d.content);
      if (!parsed.success) return null;
      const score = d.score as { total?: number } | null;
      return {
        id: d.id,
        version: d.version,
        total: typeof score?.total === "number" ? score.total : null,
        createdAt: d.created_at,
        sections: parsed.data,
      };
    })
    .filter((v): v is VersionItem => v !== null);

  const coverLetters: CoverLetterVersionItem[] = (docs ?? [])
    .filter((d) => d.doc_type === "cover_letter")
    .map((d) => {
      const parsed = coverLetterContentSchema.safeParse(d.content);
      if (!parsed.success) return null;
      return {
        id: d.id,
        version: d.version,
        createdAt: d.created_at,
        content: parsed.data,
      };
    })
    .filter((v): v is CoverLetterVersionItem => v !== null);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/dashboard" className="text-xs text-faint hover:text-ink">
            ← Applications
          </Link>
          <h1 className="text-xl font-semibold">{app.role_title}</h1>
          <p className="text-sm text-muted">{app.company}</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-faint">Status</span>
          <StatusSelect id={app.id} initial={app.status as ApplicationStatus} />
        </div>
      </div>

      {/* Multi-step flow */}
      {sections?.success ? (
        <ApplicationWizard
          applicationId={app.id}
          baseResumeId={resume?.id ?? null}
          sections={sections.data}
          jd={jdData}
          initialRubric={rubric}
          jobDescription={app.job_description}
          resumeSaved={versions.length > 0}
          coverLetterSaved={coverLetters.length > 0}
        />
      ) : (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
          No base resume found.{" "}
          <Link href="/onboarding" className="underline">
            Set up your resume
          </Link>{" "}
          to score and tailor against this job.
        </div>
      )}

      {/* Saved versions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink">
            Resume versions
          </h2>
          <VersionList versions={versions} />
        </div>
        <div className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink">
            Cover letter versions
          </h2>
          <CoverLetterVersionList versions={coverLetters} />
        </div>
      </div>

      {/* Version diff */}
      {versions.length >= 2 ? (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink">
            Compare resume versions
          </h2>
          <VersionDiff versions={versions} />
        </div>
      ) : null}
    </div>
  );
}
