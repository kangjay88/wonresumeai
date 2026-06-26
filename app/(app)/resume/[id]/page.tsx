import { notFound } from "next/navigation";

import { requireUser } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { emptyResumeSections, resumeSectionsSchema } from "@/lib/types";

import { ResumeBuilder } from "./builder";

export default async function ResumePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("base_resumes")
    .select("id, name, sections")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data) {
    notFound();
  }

  const parsed = resumeSectionsSchema.safeParse(data.sections);
  const sections = parsed.success ? parsed.data : emptyResumeSections();

  return (
    <ResumeBuilder id={data.id} name={data.name} initialSections={sections} />
  );
}
