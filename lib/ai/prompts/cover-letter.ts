import type { JdExtraction, ResumeSections } from "@/lib/types";

/**
 * Cover-letter prompt (Sonnet). Static system block (cacheable). Same product
 * rules as tailoring: the candidate's voice, no fabrication, no clichés/AI-tells.
 */

export const COVER_LETTER_SYSTEM_V1 = `You write a concise, specific cover letter for a candidate applying to a job, in THEIR voice, using ONLY facts present in their resume.

You receive the candidate's resume, the target job (company, role, extracted skills), and samples of the candidate's authentic writing.

Return ONLY a JSON object (no prose, no code fences):
{ "paragraphs": [ { "suggested": "", "reasoning": "" } ] }

Write 3 body paragraphs (do NOT include the greeting or sign-off — those are added separately):
1. Opening: why this role/company and a one-line hook tying the candidate's background to the job.
2. Evidence: 2–3 concrete, resume-backed achievements that map to the job's required skills — reuse the candidate's real metrics; never invent numbers, employers, or tools.
3. Close: brief, genuine enthusiasm and a forward-looking line (no "I would be a great fit" filler).

Rules:
- Stay truthful to the resume. If the resume lacks evidence for a required skill, do not claim it.
- Preserve the candidate's voice from the samples — natural, direct, not corporate.
- Banned (reads as AI/cliché): "delve", "utilize", "honed", "showcasing", "synergy", "I am writing to", "results-driven", "team player", "passionate about", "perfect fit". Use plain language.
- Keep each paragraph 2–4 sentences. No bullet points.
- "reasoning": one short line on what each paragraph is doing (for the user, not the letter).`;

export function buildCoverLetterUserPrompt(
  sections: ResumeSections,
  jd: JdExtraction,
  company: string,
  roleTitle: string,
  voiceSamples: string[]
): string {
  const experience = sections.experience
    .map((r) => {
      const bullets = r.bullets.filter(Boolean).map((b) => `    - ${b}`).join("\n");
      return `  ${r.title} @ ${r.company} (${r.startDate}–${r.endDate})\n${bullets}`;
    })
    .join("\n");

  const voice = voiceSamples.length
    ? voiceSamples.slice(0, 8).map((s) => `- ${s}`).join("\n")
    : "(none provided)";

  return [
    `TARGET: ${roleTitle} at ${company}`,
    `Required skills: ${jd.required_skills.join(", ") || "(none)"}`,
    `Preferred skills: ${jd.preferred_skills.join(", ") || "(none)"}`,
    `Domain: ${jd.domain_terms.join(", ") || "(none)"}`,
    "",
    "CANDIDATE VOICE SAMPLES (match this style):",
    voice,
    "",
    "RESUME:",
    `  Summary: ${sections.summary || "(none)"}`,
    `  Skills: ${sections.skills.join(", ") || "(none)"}`,
    "  Experience:",
    experience || "  (none)",
    "",
    "Write the cover letter JSON now.",
  ].join("\n");
}
