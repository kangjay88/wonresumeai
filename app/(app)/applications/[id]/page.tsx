import Link from "next/link";
import { notFound } from "next/navigation";

import { requireUser } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ApplicationStatus } from "@/lib/supabase/types";
import {
  coverLetterContentSchema,
  jdExtractionSchema,
  resumeSectionsSchema,
} from "@/lib/types";

import { ApplicationScore } from "./application-score";
import { CoverLetterPanel } from "./cover-letter-panel";
import {
  CoverLetterVersionList,
  type CoverLetterVersionItem,
} from "./cover-letter-version-list";
import { StatusSelect } from "./status-select";
import { TailorPanel } from "./tailor-panel";
import { VersionList, type VersionItem } from "./version-list";

function ChipGroup({ label, items }: { label: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item, i) => (
          <span
            key={`${item}-${i}`}
            className="rounded-full bg-gray-100 px-2.5 py-1 text-sm"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

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
      .select("id, company, role_title, job_description, jd_extraction, status, applied_at")
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
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/dashboard" className="text-xs text-gray-400 hover:text-gray-600">
            ← Applications
          </Link>
          <h1 className="text-xl font-semibold">{app.role_title}</h1>
          <p className="text-sm text-gray-500">{app.company}</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-400">Status</span>
          <StatusSelect id={app.id} initial={app.status as ApplicationStatus} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Score */}
        <div className="space-y-4">
          {sections?.success ? (
            <ApplicationScore
              applicationId={app.id}
              sections={sections.data}
              jd={jdData}
            />
          ) : (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              No base resume found.{" "}
              <Link href="/onboarding" className="underline">
                Set up your resume
              </Link>{" "}
              to score against this job.
            </div>
          )}
          {!jd?.success ? (
            <p className="text-xs text-gray-400">
              JD keyword extraction is unavailable for this application, so the
              keyword category is excluded from the score.
            </p>
          ) : null}
        </div>

        {/* JD signals */}
        <div className="space-y-5">
          {jd?.success ? (
            <div className="space-y-4 rounded-lg border border-gray-200 p-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-700">
                Extracted from the JD
              </h2>
              <ChipGroup label="Required skills" items={jd.data.required_skills} />
              <ChipGroup label="Preferred skills" items={jd.data.preferred_skills} />
              <ChipGroup label="Title variants" items={jd.data.title_variants} />
              <ChipGroup label="Seniority signals" items={jd.data.seniority_signals} />
              <ChipGroup label="Domain terms" items={jd.data.domain_terms} />
            </div>
          ) : null}

          <details className="rounded-lg border border-gray-200 p-4">
            <summary className="cursor-pointer text-sm font-semibold uppercase tracking-wide text-gray-700">
              Job description
            </summary>
            <p className="mt-3 whitespace-pre-wrap text-sm text-gray-600">
              {app.job_description}
            </p>
          </details>
        </div>
      </div>

      {/* Tailoring */}
      {sections?.success ? (
        <TailorPanel
          applicationId={app.id}
          baseResumeId={resume?.id ?? null}
          sections={sections.data}
          jd={jdData}
        />
      ) : null}

      {/* Cover letter */}
      {sections?.success ? (
        <CoverLetterPanel applicationId={app.id} contact={sections.data.contact} />
      ) : null}

      {/* Saved versions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-700">
            Resume versions
          </h2>
          <VersionList versions={versions} />
        </div>
        <div className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-700">
            Cover letter versions
          </h2>
          <CoverLetterVersionList versions={coverLetters} />
        </div>
      </div>
    </div>
  );
}
