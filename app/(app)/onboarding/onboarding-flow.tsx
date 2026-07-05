"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  ChipList,
  ResumeSectionsEditor,
  Section,
} from "@/components/resume-editor";
import { Button } from "@/components/ui";
import type { ParsedResume, ResumeSections } from "@/lib/types";

import { persistCareerMemory } from "./actions";

type Step = "upload" | "confirm";

export function OnboardingFlow() {
  const [step, setStep] = useState<Step>("upload");
  const [draft, setDraft] = useState<ParsedResume | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  if (step === "confirm" && draft) {
    return (
      <ConfirmStep
        draft={draft}
        warnings={warnings}
        onChange={setDraft}
        onBack={() => setStep("upload")}
      />
    );
  }

  return (
    <UploadStep
      onParsed={(parsed, parseWarnings) => {
        setDraft(parsed);
        setWarnings(parseWarnings);
        setStep("confirm");
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Step 1 — upload + parse
// ---------------------------------------------------------------------------

function UploadStep({
  onParsed,
}: {
  onParsed: (p: ParsedResume, warnings: string[]) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleParse() {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/ai/parse-resume", {
        method: "POST",
        body,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong parsing the resume.");
        return;
      }
      onParsed(
        data as ParsedResume,
        Array.isArray(data.warnings) ? (data.warnings as string[]) : [],
      );
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-line px-6 py-10 text-center hover:border-muted">
        <span className="text-sm font-medium">
          {file ? file.name : "Choose a PDF resume"}
        </span>
        <span className="text-xs text-muted">PDF, up to 6 MB</span>
        <input
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            setError(null);
          }}
        />
      </label>

      {error ? (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      ) : null}

      <Button onClick={handleParse} disabled={!file || loading}>
        {loading ? "Reading resume…" : "Parse resume"}
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2 — editable confirmation
// ---------------------------------------------------------------------------

function ConfirmStep({
  draft,
  warnings,
  onChange,
  onBack,
}: {
  draft: ParsedResume;
  warnings: string[];
  onChange: (p: ParsedResume) => void;
  onBack: () => void;
}) {
  const router = useRouter();
  const [saving, startSaving] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function setSections(sections: ResumeSections) {
    onChange({ ...draft, sections });
  }

  function setTargetRoles(target_roles: string[]) {
    onChange({ ...draft, target_roles });
  }

  function handleSave() {
    setError(null);
    startSaving(async () => {
      const result = await persistCareerMemory(draft);
      if (result.ok) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-8">
      {warnings.length ? (
        <div className="space-y-1 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
          <p className="font-medium">Heads up — this PDF may not have parsed cleanly:</p>
          <ul className="list-disc space-y-1 pl-5">
            {warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="text-sm text-muted">
        Here&apos;s your career memory, assembled. Fix anything the parser got
        wrong, then save.
      </p>

      <Section
        title="Suggested target roles"
        hint="Roles we'll consider when tailoring. Remove any that don't fit."
      >
        <ChipList
          items={draft.target_roles}
          placeholder="Add a target role"
          onChange={setTargetRoles}
        />
      </Section>

      <ResumeSectionsEditor sections={draft.sections} onChange={setSections} />

      {error ? (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex items-center gap-3 border-t border-line pt-4">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save career memory"}
        </Button>
        <button
          type="button"
          onClick={onBack}
          disabled={saving}
          className="text-sm text-muted hover:text-ink"
        >
          Upload a different file
        </button>
      </div>
    </div>
  );
}
