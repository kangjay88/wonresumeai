import { NextResponse } from "next/server";

import { describeAnthropicError, getAnthropic, MODELS } from "@/lib/ai/client";
import { parseModelJson } from "@/lib/ai/json";
import {
  COVER_LETTER_SYSTEM_V1,
  buildCoverLetterUserPrompt,
} from "@/lib/ai/prompts/cover-letter";
import { getOptionalUser } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  coverLetterResultSchema,
  jdExtractionSchema,
  resumeSectionsSchema,
} from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const user = await getOptionalUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let applicationId: string;
  try {
    const body = await request.json();
    applicationId = String(body.applicationId ?? "");
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (!applicationId) {
    return NextResponse.json({ error: "Missing applicationId." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const [{ data: app }, { data: latestVersion }, { data: base }, { data: memory }] =
    await Promise.all([
      supabase
        .from("applications")
        .select("company, role_title, jd_extraction")
        .eq("id", applicationId)
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("documents")
        .select("content")
        .eq("application_id", applicationId)
        .eq("user_id", user.id)
        .eq("doc_type", "resume")
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("base_resumes")
        .select("sections")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("career_memory")
        .select("voice_samples")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

  if (!app) {
    return NextResponse.json({ error: "Application not found." }, { status: 404 });
  }

  // Prefer the latest tailored resume version; fall back to the base resume.
  const source = latestVersion?.content ?? base?.sections;
  const sections = resumeSectionsSchema.safeParse(source);
  if (!sections.success) {
    return NextResponse.json({ error: "No resume to base the letter on." }, { status: 400 });
  }
  const jd = jdExtractionSchema.safeParse(app.jd_extraction ?? {});
  const voiceSamples: string[] = Array.isArray(memory?.voice_samples)
    ? (memory.voice_samples as string[])
    : [];

  const anthropic = getAnthropic();
  const userPrompt = buildCoverLetterUserPrompt(
    sections.data,
    jd.success ? jd.data : jdExtractionSchema.parse({}),
    app.company,
    app.role_title,
    voiceSamples
  );

  const call = async () => {
    const message = await anthropic.messages.create({
      model: MODELS.sonnet,
      max_tokens: 2000,
      system: [
        { type: "text", text: COVER_LETTER_SYSTEM_V1, cache_control: { type: "ephemeral" } },
      ],
      messages: [{ role: "user", content: userPrompt }],
    });
    const block = message.content.find((b) => b.type === "text");
    return block && block.type === "text" ? block.text : "";
  };

  try {
    return NextResponse.json(parseModelJson(await call(), coverLetterResultSchema));
  } catch (firstError) {
    const apiError = describeAnthropicError(firstError);
    if (apiError) {
      return NextResponse.json({ error: apiError.message }, { status: apiError.status });
    }
    try {
      return NextResponse.json(parseModelJson(await call(), coverLetterResultSchema));
    } catch (secondError) {
      const retryApiError = describeAnthropicError(secondError);
      if (retryApiError) {
        return NextResponse.json({ error: retryApiError.message }, { status: retryApiError.status });
      }
      return NextResponse.json({ error: "Cover letter generation failed. Please try again." }, { status: 502 });
    }
  }
}
