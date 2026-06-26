"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { describeAnthropicError } from "@/lib/ai/client";
import { extractJd, MAX_JD_CHARS } from "@/lib/ai/extract-jd";
import { getOptionalUser } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ApplicationStatus } from "@/lib/supabase/types";

export type CreateResult = { ok: false; error: string }; // success path redirects

const STATUSES: ApplicationStatus[] = [
  "saved", "applied", "interviewing", "offer", "rejected", "accepted",
];

export async function createApplication(
  _prev: CreateResult | null,
  formData: FormData
): Promise<CreateResult | null> {
  const user = await getOptionalUser();
  if (!user) return { ok: false, error: "Your session expired. Please sign in again." };

  const company = String(formData.get("company") ?? "").trim();
  const roleTitle = String(formData.get("role_title") ?? "").trim();
  const jobDescription = String(formData.get("job_description") ?? "").trim();

  if (!company || !roleTitle || !jobDescription) {
    return { ok: false, error: "Company, role title, and job description are all required." };
  }
  if (jobDescription.length > MAX_JD_CHARS) {
    return { ok: false, error: `Job description is too long (max ${MAX_JD_CHARS} characters).` };
  }

  const supabase = await createSupabaseServerClient();

  // Extract JD signals first so the row is created complete.
  let jdExtraction = null;
  try {
    jdExtraction = await extractJd(jobDescription);
  } catch (err) {
    const apiError = describeAnthropicError(err);
    if (apiError) return { ok: false, error: apiError.message };
    console.error("createApplication extract error:", err);
    // Non-fatal: save the application without extraction; it can be re-run later.
  }

  const { data, error } = await supabase
    .from("applications")
    .insert({
      user_id: user.id,
      company,
      role_title: roleTitle,
      job_description: jobDescription,
      jd_extraction: jdExtraction,
      status: "saved",
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("createApplication insert error:", error);
    return { ok: false, error: "Could not save the application." };
  }

  revalidatePath("/dashboard");
  redirect(`/applications/${data.id}`);
}

export async function updateApplicationStatus(
  id: string,
  status: ApplicationStatus
): Promise<{ ok: boolean; error?: string }> {
  const user = await getOptionalUser();
  if (!user) return { ok: false, error: "Session expired." };
  if (!STATUSES.includes(status)) return { ok: false, error: "Invalid status." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("applications")
    .update({
      status,
      // Stamp applied_at the first time it moves to "applied".
      ...(status === "applied" ? { applied_at: new Date().toISOString() } : {}),
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: "Could not update status." };

  revalidatePath(`/applications/${id}`);
  revalidatePath("/dashboard");
  return { ok: true };
}
