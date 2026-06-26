import { NextResponse } from "next/server";

import { describeAnthropicError, getAnthropic, MODELS } from "@/lib/ai/client";
import { parseModelJson } from "@/lib/ai/json";
import { TAILOR_SYSTEM_V1, buildTailorUserPrompt } from "@/lib/ai/prompts/tailor";
import { getOptionalUser } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  jdExtractionSchema,
  resumeSectionsSchema,
  tailorResultSchema,
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
  const [
    { data: app },
    { data: resume },
    { data: memory },
    { data: edits },
  ] = await Promise.all([
    supabase
      .from("applications")
      .select("jd_extraction")
      .eq("id", applicationId)
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
      .from("career_memory")
      .select("voice_samples")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("suggestion_edits")
      .select("ai_suggested, user_final")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  if (!app) {
    return NextResponse.json({ error: "Application not found." }, { status: 404 });
  }
  if (!resume) {
    return NextResponse.json({ error: "No base resume to tailor." }, { status: 400 });
  }

  const sections = resumeSectionsSchema.safeParse(resume.sections);
  if (!sections.success) {
    return NextResponse.json({ error: "Base resume is malformed." }, { status: 422 });
  }
  const jd = jdExtractionSchema.safeParse(app.jd_extraction ?? {});

  // voice_samples may live in the row column; if absent, fall back to none.
  const voiceSamples: string[] = Array.isArray(memory?.voice_samples)
    ? (memory.voice_samples as string[])
    : [];

  const anthropic = getAnthropic();
  const userPrompt = buildTailorUserPrompt(
    sections.data,
    jd.success ? jd.data : jdExtractionSchema.parse({}),
    voiceSamples,
    edits ?? []
  );

  const call = async () => {
    const message = await anthropic.messages.create({
      model: MODELS.sonnet,
      max_tokens: 4000,
      system: [
        { type: "text", text: TAILOR_SYSTEM_V1, cache_control: { type: "ephemeral" } },
      ],
      messages: [{ role: "user", content: userPrompt }],
    });
    const block = message.content.find((b) => b.type === "text");
    return block && block.type === "text" ? block.text : "";
  };

  try {
    return NextResponse.json(parseModelJson(await call(), tailorResultSchema));
  } catch (firstError) {
    const apiError = describeAnthropicError(firstError);
    if (apiError) {
      return NextResponse.json({ error: apiError.message }, { status: apiError.status });
    }
    try {
      return NextResponse.json(parseModelJson(await call(), tailorResultSchema));
    } catch (secondError) {
      const retryApiError = describeAnthropicError(secondError);
      if (retryApiError) {
        return NextResponse.json({ error: retryApiError.message }, { status: retryApiError.status });
      }
      return NextResponse.json({ error: "Tailoring failed. Please try again." }, { status: 502 });
    }
  }
}
