import { describeAnthropicError, getAnthropic, MODELS } from "./client";
import { parseModelJson } from "./json";
import {
  EXTRACT_JD_SYSTEM_V1,
  buildExtractJdUserPrompt,
} from "./prompts/extract-jd";
import { jdExtractionSchema, type JdExtraction } from "@/lib/types";

/** Hard cap on JD length sent to the model (also a cost guard). */
export const MAX_JD_CHARS = 15_000;

/**
 * Extracts structured hiring signals from a job description with Haiku.
 * Throws on API failure (caller maps via describeAnthropicError) or if the
 * model output can't be parsed after one retry.
 */
export async function extractJd(jobDescription: string): Promise<JdExtraction> {
  const anthropic = getAnthropic();
  const userPrompt = buildExtractJdUserPrompt(jobDescription.slice(0, MAX_JD_CHARS));

  const call = async () => {
    const message = await anthropic.messages.create({
      model: MODELS.haiku,
      max_tokens: 1500,
      system: [
        {
          type: "text",
          text: EXTRACT_JD_SYSTEM_V1,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: userPrompt }],
    });
    const block = message.content.find((b) => b.type === "text");
    return block && block.type === "text" ? block.text : "";
  };

  try {
    return parseModelJson(await call(), jdExtractionSchema);
  } catch (err) {
    // Don't retry hard API errors (billing/auth) — they won't self-resolve.
    if (describeAnthropicError(err)) throw err;
    return parseModelJson(await call(), jdExtractionSchema);
  }
}
