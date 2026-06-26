"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resumeSectionsSchema, type ResumeSections } from "@/lib/types";

export type SaveResult = { ok: true } | { ok: false; error: string };

export async function saveResume(
  id: string,
  sections: ResumeSections
): Promise<SaveResult> {
  const user = await requireUser();

  const validation = resumeSectionsSchema.safeParse(sections);
  if (!validation.success) {
    return { ok: false, error: "The resume data was invalid." };
  }

  const supabase = await createSupabaseServerClient();
  // RLS restricts the update to the owner's row; the explicit user_id filter is
  // defense in depth.
  const { error } = await supabase
    .from("base_resumes")
    .update({ sections: validation.data })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { ok: false, error: "Could not save the resume." };
  }

  revalidatePath(`/resume/${id}`);
  revalidatePath("/dashboard");
  return { ok: true };
}
