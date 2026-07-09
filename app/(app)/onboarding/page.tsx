import { requireUser } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { careerProfileSchema, resumeSectionsSchema } from "@/lib/types";

import {
  CareerMemoryManager,
  type LearnedEdit,
} from "./career-memory-manager";
import { OnboardingFlow } from "./onboarding-flow";

export default async function OnboardingPage() {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const [{ data: memory }, { data: resume }, { data: edits }] =
    await Promise.all([
      supabase
        .from("career_memory")
        .select("profile, voice_samples")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("base_resumes")
        .select("sections")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("suggestion_edits")
        .select("id, ai_suggested, user_final")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(12),
    ]);

  const profile = memory ? careerProfileSchema.safeParse(memory.profile) : null;
  const sections = resume ? resumeSectionsSchema.safeParse(resume.sections) : null;

  // Manager needs both an existing profile and an editable base résumé.
  const canManage = Boolean(profile?.success && sections?.success);

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6 lg:p-8">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Career memory</h1>
        <p className="text-sm text-muted">
          {canManage
            ? "The profile behind every score and tailored résumé. Edit it, manage your voice samples, and see what tailoring has learned."
            : "Upload your résumé PDF. We'll read it into a structured profile you can review and edit, then use it to tailor future applications."}
        </p>
      </div>

      {canManage && profile?.success && sections?.success ? (
        <CareerMemoryManager
          initialSections={sections.data}
          initialTargetRoles={profile.data.target_roles}
          initialVoiceSamples={
            Array.isArray(memory?.voice_samples)
              ? (memory!.voice_samples as string[])
              : []
          }
          learned={(edits ?? []) as LearnedEdit[]}
        />
      ) : (
        <OnboardingFlow />
      )}
    </div>
  );
}
