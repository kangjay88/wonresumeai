/**
 * Prompt for extracting structured signals from a job description. Run with
 * Haiku, cached per application. The output (JdExtraction) drives the keyword
 * scoring category (B) and the tailoring prompt.
 */

export const EXTRACT_JD_SYSTEM_V1 = `You extract structured hiring signals from a job description. Return ONLY a JSON object (no prose, no code fences) with this exact shape:
{
  "required_skills": ["", ""],
  "preferred_skills": ["", ""],
  "title_variants": ["", ""],
  "seniority_signals": ["", ""],
  "domain_terms": ["", ""]
}

Rules:
- required_skills: hard skills, tools, languages, or qualifications the JD states as required / must-have. Use short canonical terms (e.g. "React", "PostgreSQL", "CI/CD"), not full sentences. Deduplicate.
- preferred_skills: skills described as nice-to-have, bonus, or preferred. Same format.
- title_variants: the job title plus close variants a recruiter might search (e.g. JD "Sr. Software Engineer" -> ["Senior Software Engineer", "Software Engineer", "SWE"]).
- seniority_signals: words/phrases indicating level and expectations (e.g. "senior", "5+ years", "mentorship", "ownership", "lead"). Include any explicit years-of-experience requirement verbatim.
- domain_terms: industry/domain vocabulary central to the role (e.g. "payments", "healthcare", "real-time", "B2B SaaS").
- Extract only what the JD actually says. Do not invent skills. If a category has nothing, use [].
- Prefer specific, matchable terms over generic ones ("Kubernetes" over "container orchestration tools" when both appear; include the specific).`;

export function buildExtractJdUserPrompt(jobDescription: string): string {
  return `Job description:\n\n<jd>\n${jobDescription}\n</jd>\n\nReturn the structured JSON now.`;
}
