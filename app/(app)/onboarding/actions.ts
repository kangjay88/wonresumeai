"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  parsedResumeSchema,
  resumeSectionsSchema,
  type CareerProfile,
  type ParsedResume,
  type ResumeSections,
} from "@/lib/types";
import { harvestVoiceSamples, normalizeVoiceSamples } from "@/lib/voice";

const MASTER_RESUME_NAME = "Master resume";

/** Condense the structured resume into the career-memory profile. */
function deriveProfile(
  sections: ResumeSections,
  targetRoles: string[]
): CareerProfile {
  return {
    summary: sections.summary,
    roles: sections.experience.map((e) => ({
      company: e.company,
      title: e.title,
      startDate: e.startDate,
      endDate: e.endDate,
    })),
    skills: sections.skills,
    education: sections.education,
    target_roles: targetRoles,
  };
}

type ServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

/** Insert or update the single "Master resume" base row. */
function upsertMasterResume(
  supabase: ServerClient,
  userId: string,
  sections: ResumeSections,
  existingId: string | null,
) {
  return existingId
    ? supabase.from("base_resumes").update({ sections }).eq("id", existingId)
    : supabase.from("base_resumes").insert({
        user_id: userId,
        name: MASTER_RESUME_NAME,
        sections,
      });
}

async function findMasterResumeId(
  supabase: ServerClient,
  userId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("base_resumes")
    .select("id")
    .eq("user_id", userId)
    .eq("name", MASTER_RESUME_NAME)
    .maybeSingle();
  return data?.id ?? null;
}

async function findCareerMemoryId(
  supabase: ServerClient,
  userId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("career_memory")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  return data?.id ?? null;
}

export type PersistResult = { ok: true } | { ok: false; error: string };

export async function persistCareerMemory(
  input: ParsedResume
): Promise<PersistResult> {
  const user = await requireUser();

  const validation = parsedResumeSchema.safeParse(input);
  if (!validation.success) {
    return { ok: false, error: "The submitted resume data was invalid." };
  }
  const { sections, target_roles } = validation.data;

  const supabase = await createSupabaseServerClient();
  const profile = deriveProfile(sections, target_roles);
  const voiceSamples = harvestVoiceSamples(sections);

  // --- career_memory: one row per user (insert or update) ------------------
  const existingMemoryId = await findCareerMemoryId(supabase, user.id);
  const memoryWrite = existingMemoryId
    ? await supabase
        .from("career_memory")
        .update({ profile, voice_samples: voiceSamples })
        .eq("id", existingMemoryId)
    : await supabase.from("career_memory").insert({
        user_id: user.id,
        profile,
        voice_samples: voiceSamples,
      });

  if (memoryWrite.error) {
    return { ok: false, error: "Could not save career memory." };
  }

  // --- base_resumes: seed/update the "Master resume" -----------------------
  const existingResumeId = await findMasterResumeId(supabase, user.id);
  const resumeWrite = await upsertMasterResume(
    supabase,
    user.id,
    sections,
    existingResumeId,
  );
  if (resumeWrite.error) {
    return { ok: false, error: "Could not seed the base resume." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/onboarding");
  return { ok: true };
}

/**
 * Edit path: save résumé sections + target roles without re-uploading a PDF.
 * Re-derives the profile, but leaves voice_samples alone — those are managed
 * separately so a résumé tweak doesn't wipe curated voice.
 */
export async function updateCareerMemory(
  sections: ResumeSections,
  targetRoles: string[],
): Promise<PersistResult> {
  const user = await requireUser();

  const parsed = resumeSectionsSchema.safeParse(sections);
  if (!parsed.success) {
    return { ok: false, error: "The résumé data was invalid." };
  }
  const roles = Array.from(
    new Set(targetRoles.map((r) => r.trim()).filter(Boolean)),
  );

  const supabase = await createSupabaseServerClient();
  const memoryId = await findCareerMemoryId(supabase, user.id);
  if (!memoryId) {
    return { ok: false, error: "No career memory to update. Upload a résumé first." };
  }

  const profile = deriveProfile(parsed.data, roles);
  const memoryWrite = await supabase
    .from("career_memory")
    .update({ profile })
    .eq("id", memoryId);
  if (memoryWrite.error) {
    return { ok: false, error: "Could not save career memory." };
  }

  const resumeWrite = await upsertMasterResume(
    supabase,
    user.id,
    parsed.data,
    await findMasterResumeId(supabase, user.id),
  );
  if (resumeWrite.error) {
    return { ok: false, error: "Could not save the base résumé." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/onboarding");
  return { ok: true };
}

/** Replace the curated voice-sample list (normalized: trimmed, deduped, capped). */
export async function updateVoiceSamples(
  samples: string[],
): Promise<PersistResult> {
  const user = await requireUser();
  const clean = normalizeVoiceSamples(samples);

  const supabase = await createSupabaseServerClient();
  const memoryId = await findCareerMemoryId(supabase, user.id);
  if (!memoryId) {
    return { ok: false, error: "No career memory to update. Upload a résumé first." };
  }

  const { error } = await supabase
    .from("career_memory")
    .update({ voice_samples: clean })
    .eq("id", memoryId);
  if (error) {
    return { ok: false, error: "Could not save voice samples." };
  }

  revalidatePath("/onboarding");
  return { ok: true };
}
