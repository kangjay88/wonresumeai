/**
 * Shared domain types for resume data.
 *
 * The same `ResumeSections` shape is the single source of truth for:
 *   - base_resumes.sections
 *   - documents.content (for doc_type = 'resume')
 *   - the resume builder editor + PDF template (Phase 2)
 *   - the scoring engine input (Phase 3)
 *
 * Dates are normalized to "MMM YYYY" (e.g. "Jan 2024") or the literal
 * "Present" for current roles, so the A3 (parseable dates) scoring check and
 * the PDF renderer can rely on one format.
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// Zod schemas — used to validate LLM output and persisted input at the edges.
// Types below are inferred from these so the schema is the single definition.
// ---------------------------------------------------------------------------

/** Tolerates models that emit `null` (not just omit) for empty string fields. */
const lenientString = z
  .string()
  .nullish()
  .transform((v) => v ?? "");

/** Tolerates a null/omitted array and null/blank items; yields a clean
 *  string[]. Models sometimes return `null` for an "empty" list, which a plain
 *  `.default([])` (undefined-only) would reject. */
const lenientStringArray = z
  .array(lenientString)
  .nullish()
  .transform((arr) => (arr ?? []).map((s) => s.trim()).filter(Boolean));

export const contactSchema = z.object({
  name: lenientString,
  email: lenientString,
  phone: lenientString,
  location: lenientString,
  linkedin: lenientString,
  website: lenientString,
});

export const experienceEntrySchema = z.object({
  company: lenientString,
  title: lenientString,
  location: lenientString,
  startDate: lenientString, // "MMM YYYY"
  endDate: lenientString, // "MMM YYYY" | "Present"
  bullets: lenientStringArray,
});

export const educationEntrySchema = z.object({
  school: lenientString,
  degree: lenientString,
  field: lenientString,
  startDate: lenientString,
  endDate: lenientString,
  details: lenientString,
});

export const projectEntrySchema = z.object({
  name: lenientString,
  description: lenientString,
  link: lenientString,
  bullets: lenientStringArray,
});

export const resumeSectionsSchema = z.object({
  contact: contactSchema,
  summary: lenientString,
  experience: z.array(experienceEntrySchema).default([]),
  education: z.array(educationEntrySchema).default([]),
  skills: lenientStringArray,
  projects: z.array(projectEntrySchema).default([]),
});

export type Contact = z.infer<typeof contactSchema>;
export type ExperienceEntry = z.infer<typeof experienceEntrySchema>;
export type EducationEntry = z.infer<typeof educationEntrySchema>;
export type ProjectEntry = z.infer<typeof projectEntrySchema>;
export type ResumeSections = z.infer<typeof resumeSectionsSchema>;

// ---------------------------------------------------------------------------
// Career memory profile (career_memory.profile). Derived from a base resume;
// `roles` is a condensed view of experience used for prompt context.
// ---------------------------------------------------------------------------

export const profileRoleSchema = z.object({
  company: z.string(),
  title: z.string(),
  startDate: z.string(),
  endDate: z.string(),
});

export const careerProfileSchema = z.object({
  summary: z.string().default(""),
  roles: z.array(profileRoleSchema).default([]),
  skills: z.array(z.string()).default([]),
  education: z.array(educationEntrySchema).default([]),
  target_roles: z.array(z.string()).default([]),
});

export type ProfileRole = z.infer<typeof profileRoleSchema>;
export type CareerProfile = z.infer<typeof careerProfileSchema>;

// ---------------------------------------------------------------------------
// parse-resume route contract: what one Haiku call returns from a resume PDF.
// We ask only for the structured resume + suggested target roles; the profile
// and voice samples are derived server-side from these.
// ---------------------------------------------------------------------------

export const parsedResumeSchema = z.object({
  sections: resumeSectionsSchema,
  target_roles: lenientStringArray,
});

export type ParsedResume = z.infer<typeof parsedResumeSchema>;

// ---------------------------------------------------------------------------
// JD extraction (applications.jd_extraction): cached Haiku output, consumed by
// the keyword-match scoring category (B) and the tailoring prompt.
// ---------------------------------------------------------------------------

export const jdExtractionSchema = z.object({
  required_skills: lenientStringArray,
  preferred_skills: lenientStringArray,
  title_variants: lenientStringArray,
  seniority_signals: lenientStringArray,
  domain_terms: lenientStringArray,
});

export type JdExtraction = z.infer<typeof jdExtractionSchema>;

// ---------------------------------------------------------------------------
// AI review (api/ai/review): on-demand Sonnet pass that powers the C2/C3 LLM
// rubric and semantic JD-coverage. Layered into the score via scoreResume opts.
// ---------------------------------------------------------------------------

export const reviewBulletSchema = z.object({
  role_index: z.coerce.number().int(),
  bullet_index: z.coerce.number().int(),
  /** C2 — outcome vs duty, anchored 1–5. */
  outcome_score: z.coerce.number().min(1).max(5).catch(3),
  outcome_note: lenientString,
  /** C3 — Accomplished X, measured by Y, by doing Z. */
  xyz_complete: z.boolean().default(false),
  missing_element: lenientString,
});

export const reviewResultSchema = z.object({
  bullets: z.array(reviewBulletSchema).default([]),
  /** Required skills the resume demonstrates even if not literally matched. */
  skills_present: z.array(z.string()).default([]),
});

export type ReviewBullet = z.infer<typeof reviewBulletSchema>;
export type ReviewResult = z.infer<typeof reviewResultSchema>;

// ---------------------------------------------------------------------------
// Tailoring (api/ai/tailor): the Sonnet suggestion set rendered as cards.
// ---------------------------------------------------------------------------

export const tailorSummarySchema = z.object({
  original: lenientString,
  suggested: lenientString,
  reasoning: lenientString,
});

export const tailorBulletSchema = z.object({
  role_index: z.coerce.number().int(),
  bullet_index: z.coerce.number().int(),
  original: lenientString,
  suggested: lenientString,
  reasoning: lenientString,
  keywords_addressed: z.array(z.string()).default([]),
  score_delta: z.coerce.number().default(0),
  /** When a real metric is needed, the model asks rather than inventing one. */
  needs_input: lenientString,
});

export const tailorResultSchema = z.object({
  summary: tailorSummarySchema.nullish().transform((v) => v ?? null),
  bullets: z.array(tailorBulletSchema).default([]),
  skills_to_add: z.array(z.string()).default([]),
  skills_to_remove: z.array(z.string()).default([]),
});

export type TailorSummary = z.infer<typeof tailorSummarySchema>;
export type TailorBullet = z.infer<typeof tailorBulletSchema>;
export type TailorResult = z.infer<typeof tailorResultSchema>;

// ---------------------------------------------------------------------------
// Cover letters (api/ai/cover-letter + documents.content for cover_letter).
// ---------------------------------------------------------------------------

/** Model output: body paragraphs as suggestion cards. */
export const coverLetterResultSchema = z.object({
  paragraphs: z
    .array(z.object({ suggested: lenientString, reasoning: lenientString }))
    .default([]),
});

export type CoverLetterResult = z.infer<typeof coverLetterResultSchema>;

/** Saved document content — self-contained so any version re-renders alone. */
export const coverLetterContentSchema = z.object({
  contact: contactSchema,
  greeting: lenientString,
  paragraphs: z.array(z.string()).default([]),
  closing: lenientString,
});

export type CoverLetterContent = z.infer<typeof coverLetterContentSchema>;

/** An empty resume — the starting point for a from-scratch builder. */
export function emptyResumeSections(): ResumeSections {
  return resumeSectionsSchema.parse({ contact: {} });
}
