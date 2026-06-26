"use server";

import { revalidatePath } from "next/cache";

import { getOptionalUser } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resumeSectionsSchema, type ResumeSections } from "@/lib/types";

export type SaveResult = { ok: true } | { ok: false; error: string };

export async function saveResume(
  id: string,
  sections: ResumeSections
): Promise<SaveResult> {
  try {
    // Use the non-redirecting check: a server action must return a value, not
    // throw a redirect, or the client gets an opaque "unexpected response".
    const user = await getOptionalUser();
    if (!user) {
      return { ok: false, error: "Your session expired. Please sign in again." };
    }

    const validation = resumeSectionsSchema.safeParse(sections);
    if (!validation.success) {
      return { ok: false, error: "The resume data was invalid." };
    }

    const supabase = await createSupabaseServerClient();
    // RLS restricts the update to the owner's row; the explicit user_id filter
    // is defense in depth.
    const { error } = await supabase
      .from("base_resumes")
      .update({ sections: validation.data })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("saveResume DB error:", error);
      return { ok: false, error: "Could not save the resume." };
    }

    // Refresh the dashboard's cached view (shows most-recent role). Do NOT
    // revalidate /resume/[id]: this action is invoked from that page and the
    // client already holds the saved state, so re-rendering it server-side is
    // unnecessary and was triggering a failing re-render.
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (err) {
    console.error("saveResume unexpected error:", err);
    return { ok: false, error: "Could not save the resume. Please try again." };
  }
}
