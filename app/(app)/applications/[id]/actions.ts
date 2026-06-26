"use server";

import { revalidatePath } from "next/cache";

import { getOptionalUser } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";
import { resumeSectionsSchema, type ResumeSections } from "@/lib/types";

export interface ScoreSnapshot {
  total: number;
  categories: { key: string; label: string; score: number }[];
}

export interface SuggestionEditPair {
  ai_suggested: string;
  user_final: string;
}

export type SaveVersionResult =
  | { ok: true; version: number }
  | { ok: false; error: string };

/**
 * Saves the accepted tailoring as a new immutable resume document version, and
 * records any AI suggestions the user edited before accepting (the voice loop).
 */
export async function saveTailoredVersion(input: {
  applicationId: string;
  baseResumeId: string | null;
  sections: ResumeSections;
  score: ScoreSnapshot;
  edits: SuggestionEditPair[];
}): Promise<SaveVersionResult> {
  const user = await getOptionalUser();
  if (!user) return { ok: false, error: "Your session expired. Please sign in again." };

  const sections = resumeSectionsSchema.safeParse(input.sections);
  if (!sections.success) return { ok: false, error: "The tailored resume was invalid." };

  const supabase = await createSupabaseServerClient();

  // Next version number for this application's resume documents.
  const { data: latest } = await supabase
    .from("documents")
    .select("version")
    .eq("application_id", input.applicationId)
    .eq("doc_type", "resume")
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  const version = (latest?.version ?? 0) + 1;

  const { error: docError } = await supabase.from("documents").insert({
    user_id: user.id,
    application_id: input.applicationId,
    base_resume_id: input.baseResumeId,
    doc_type: "resume",
    version,
    content: sections.data as unknown as Json,
    score: input.score as unknown as Json,
  });
  if (docError) {
    console.error("saveTailoredVersion document error:", docError);
    return { ok: false, error: "Could not save the version." };
  }

  // Record edited acceptances as voice-learning pairs.
  const editRows = input.edits
    .filter((e) => e.ai_suggested.trim() && e.user_final.trim() && e.ai_suggested !== e.user_final)
    .map((e) => ({
      user_id: user.id,
      application_id: input.applicationId,
      ai_suggested: e.ai_suggested,
      user_final: e.user_final,
    }));
  if (editRows.length) {
    const { error: editError } = await supabase.from("suggestion_edits").insert(editRows);
    if (editError) console.error("saveTailoredVersion edits error:", editError);
  }

  revalidatePath(`/applications/${input.applicationId}`);
  return { ok: true, version };
}
