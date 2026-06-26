"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  ChipList,
  ResumeSectionsEditor,
  Section,
} from "@/components/resume-editor";
import type { ParsedResume, ResumeSections } from "@/lib/types";

import { persistCareerMemory } from "./actions";

type Step = "upload" | "confirm";

export function OnboardingFlow() {
  const [step, setStep] = useState<Step>("upload");
  const [draft, setDraft] = useState<ParsedResume | null>(null);

  if (step === "confirm" && draft) {
    return (
      <ConfirmStep
        draft={draft}
        onChange={setDraft}
        onBack={() => setStep("upload")}
      />
    );
  }

  return (
    <UploadStep
      onParsed={(parsed) => {
        setDraft(parsed);
        setStep("confirm");
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Step 1 — upload + parse
// ---------------------------------------------------------------------------

function UploadStep({ onParsed }: { onParsed: (p: ParsedResume) => void }) {
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
      onParsed(data as ParsedResume);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-6 py-10 text-center hover:border-gray-400">
        <span className="text-sm font-medium">
          {file ? file.name : "Choose a PDF resume"}
        </span>
        <span className="text-xs text-gray-500">PDF, up to 6 MB</span>
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
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={handleParse}
        disabled={!file || loading}
        className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {loading ? "Reading resume…" : "Parse resume"}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2 — editable confirmation
// ---------------------------------------------------------------------------

function ConfirmStep({
  draft,
  onChange,
  onBack,
}: {
  draft: ParsedResume;
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
      <p className="text-sm text-gray-600">
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
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex items-center gap-3 border-t border-gray-200 pt-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save career memory"}
        </button>
        <button
          type="button"
          onClick={onBack}
          disabled={saving}
          className="text-sm text-gray-500 hover:text-gray-900"
        >
          Upload a different file
        </button>
      </div>
    </div>
  );
}
