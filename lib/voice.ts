import type { ResumeSections } from "@/lib/types";

export const MAX_VOICE_SAMPLES = 30;
export const MIN_VOICE_SAMPLE_CHARS = 20;

/** Harvest the user's own bullets as voice ground-truth for tailoring. Shared
 *  by first-time onboarding and the "re-harvest" action in the manager. */
export function harvestVoiceSamples(
  sections: ResumeSections,
  max = MAX_VOICE_SAMPLES,
): string[] {
  const bullets = [
    ...sections.experience.flatMap((e) => e.bullets),
    ...sections.projects.flatMap((p) => p.bullets),
  ]
    .map((b) => b.trim())
    .filter((b) => b.length >= MIN_VOICE_SAMPLE_CHARS); // skip fragments

  return Array.from(new Set(bullets)).slice(0, max);
}

/** Normalize a user-managed voice list: trim, drop blanks/dupes, cap. */
export function normalizeVoiceSamples(
  samples: string[],
  max = MAX_VOICE_SAMPLES,
): string[] {
  const cleaned = samples.map((s) => s.trim()).filter(Boolean);
  return Array.from(new Set(cleaned)).slice(0, max);
}
