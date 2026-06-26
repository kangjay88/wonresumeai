import type { JdExtraction, ResumeSections } from "@/lib/types";

/**
 * Tailoring prompt (Sonnet). The system block is static (cacheable). Enforces
 * the product's core rules: preserve voice, never fabricate, ask for real
 * metrics via needs_input rather than inventing them, and avoid AI-tell words.
 */

export const TAILOR_SYSTEM_V1 = `You tailor a resume to a specific job WITHOUT fabricating anything and WITHOUT erasing the candidate's voice.

You receive: the candidate's base resume (each experience bullet tagged with role and bullet indices), the target job's extracted skills/title/seniority, samples of the candidate's authentic writing, and recent examples where the candidate rewrote your past suggestions (match that style).

Return ONLY a JSON object (no prose, no code fences):
{
  "summary": {"original":"","suggested":"","reasoning":""} ,
  "bullets": [{"role_index":0,"bullet_index":1,"original":"","suggested":"","reasoning":"","keywords_addressed":[""],"score_delta":0,"needs_input":""}],
  "skills_to_add": [""],
  "skills_to_remove": [""]
}
(Use null for "summary" if the resume has no summary worth changing.)

Rules:
- Only suggest a bullet rewrite when it materially helps for THIS job: it surfaces a required/preferred keyword the candidate genuinely has, turns a duty/weak bullet into a measured outcome, or fixes weak language. Skip bullets that are already strong and relevant — do not pad the list.
- NEVER fabricate metrics, employers, tools, dates, or outcomes. If a bullet would be stronger with a number the candidate hasn't given, write the best TRUTHFUL rewrite without a number and set "needs_input" to a specific question (e.g. "What % did load time drop?"). Otherwise set "needs_input" to "".
- "skills_to_add": only skills the candidate plausibly already has given their resume — these are suggestions to confirm, not claims. "skills_to_remove": noise skills that dilute relevance for this job.
- Preserve the candidate's voice: keep their sentence rhythm, vocabulary, and concrete details. Mirror the provided voice samples and recent rewrites. Do not homogenize every bullet.
- Banned words (recruiters flag them as AI-written): never use "delve", "utilize", "honed", "showcasing", "synergy". Use "spearheaded" at most once and "leveraged" at most twice across all suggestions. Prefer plain, strong verbs (led, built, cut, shipped).
- "original" must be the exact current text. Use the real role_index/bullet_index from the resume.
- "keywords_addressed": JD skills/terms the rewrite now surfaces. "score_delta": your rough 0–15 estimate of the improvement.`;

export function buildTailorUserPrompt(
  sections: ResumeSections,
  jd: JdExtraction,
  voiceSamples: string[],
  recentEdits: { ai_suggested: string; user_final: string }[]
): string {
  const bulletLines: string[] = [];
  sections.experience.forEach((role, r) => {
    bulletLines.push(`Role ${r}: ${role.title} @ ${role.company}`);
    role.bullets.forEach((b, i) => {
      if (b.trim()) bulletLines.push(`  [role ${r} bullet ${i}] ${b.trim()}`);
    });
  });

  const voice = voiceSamples.length
    ? voiceSamples.slice(0, 10).map((s) => `- ${s}`).join("\n")
    : "(none provided)";

  const edits = recentEdits.length
    ? recentEdits
        .slice(0, 10)
        .map((e) => `- AI suggested: ${e.ai_suggested}\n  Candidate used: ${e.user_final}`)
        .join("\n")
    : "(none yet)";

  return [
    "TARGET JOB:",
    `  Title variants: ${jd.title_variants.join(", ") || "(none)"}`,
    `  Required skills: ${jd.required_skills.join(", ") || "(none)"}`,
    `  Preferred skills: ${jd.preferred_skills.join(", ") || "(none)"}`,
    `  Seniority signals: ${jd.seniority_signals.join(", ") || "(none)"}`,
    `  Domain terms: ${jd.domain_terms.join(", ") || "(none)"}`,
    "",
    "CANDIDATE VOICE SAMPLES (match this style):",
    voice,
    "",
    "RECENT REWRITES BY THE CANDIDATE (match how they edit):",
    edits,
    "",
    "CURRENT RESUME:",
    `  Summary: ${sections.summary || "(none)"}`,
    `  Skills: ${sections.skills.join(", ") || "(none)"}`,
    "  Experience:",
    bulletLines.join("\n") || "  (none)",
    "",
    "Return the tailoring JSON now.",
  ].join("\n");
}
