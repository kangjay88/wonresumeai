"use client";

import { useState, useTransition } from "react";

import {
  ChipList,
  ResumeSectionsEditor,
  Section,
} from "@/components/resume-editor";
import { Button, Card, Textarea } from "@/components/ui";
import type { ResumeSections } from "@/lib/types";
import {
  harvestVoiceSamples,
  MAX_VOICE_SAMPLES,
  normalizeVoiceSamples,
} from "@/lib/voice";

import { updateCareerMemory, updateVoiceSamples } from "./actions";
import { OnboardingFlow } from "./onboarding-flow";

export interface LearnedEdit {
  id: string;
  ai_suggested: string;
  user_final: string;
}

export function CareerMemoryManager({
  initialSections,
  initialTargetRoles,
  initialVoiceSamples,
  learned,
}: {
  initialSections: ResumeSections;
  initialTargetRoles: string[];
  initialVoiceSamples: string[];
  learned: LearnedEdit[];
}) {
  const [replacing, setReplacing] = useState(false);
  // Lifted so voice re-harvest can read the résumé the user is editing.
  const [sections, setSections] = useState(initialSections);
  const [targetRoles, setTargetRoles] = useState(initialTargetRoles);

  if (replacing) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted">
            Replace your career memory from a new PDF. This overwrites your
            profile and re-harvests voice samples.
          </p>
          <Button
            variant="secondary"
            size="sm"
            className="shrink-0"
            onClick={() => setReplacing(false)}
          >
            Cancel
          </Button>
        </div>
        <OnboardingFlow />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <ProfileSection
        sections={sections}
        setSections={setSections}
        targetRoles={targetRoles}
        setTargetRoles={setTargetRoles}
      />
      <VoiceSection
        initialVoiceSamples={initialVoiceSamples}
        currentSections={sections}
      />
      <LearnedSection learned={learned} />

      <div className="border-t border-line pt-6">
        <p className="text-sm text-muted">
          Prefer to start over?{" "}
          <button
            type="button"
            onClick={() => setReplacing(true)}
            className="font-medium text-brand-400 hover:text-brand-300"
          >
            Replace from a new PDF
          </button>
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Résumé + target roles → base résumé + derived profile
// ---------------------------------------------------------------------------

function ProfileSection({
  sections,
  setSections,
  targetRoles,
  setTargetRoles,
}: {
  sections: ResumeSections;
  setSections: (s: ResumeSections) => void;
  targetRoles: string[];
  setTargetRoles: (r: string[]) => void;
}) {
  const [saving, startSaving] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function save() {
    setMsg(null);
    startSaving(async () => {
      const result = await updateCareerMemory(sections, targetRoles);
      setMsg(result.ok ? "Saved" : result.error);
    });
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink">
            Résumé &amp; profile
          </h2>
          <p className="text-xs text-muted">
            Edit here to update scoring and tailoring — no re-upload needed.
          </p>
        </div>
        <SaveButton onClick={save} saving={saving} msg={msg} label="Save profile" />
      </div>

      <Section
        title="Target roles"
        hint="Roles we'll consider when tailoring. Remove any that don't fit."
      >
        <ChipList
          items={targetRoles}
          placeholder="Add a target role"
          onChange={setTargetRoles}
        />
      </Section>

      <ResumeSectionsEditor sections={sections} onChange={setSections} />
    </section>
  );
}

// ---------------------------------------------------------------------------
// Voice samples
// ---------------------------------------------------------------------------

function VoiceSection({
  initialVoiceSamples,
  currentSections,
}: {
  initialVoiceSamples: string[];
  currentSections: ResumeSections;
}) {
  const [samples, setSamples] = useState<string[]>(initialVoiceSamples);
  const [draft, setDraft] = useState("");
  const [saving, startSaving] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const atCap = samples.length >= MAX_VOICE_SAMPLES;

  function save() {
    setMsg(null);
    startSaving(async () => {
      const result = await updateVoiceSamples(samples);
      setMsg(result.ok ? "Saved" : result.error);
    });
  }

  function add() {
    const value = draft.trim();
    if (!value || atCap) return;
    setSamples((prev) => normalizeVoiceSamples([...prev, value]));
    setDraft("");
  }

  function edit(i: number, value: string) {
    setSamples((prev) => prev.map((s, idx) => (idx === i ? value : s)));
  }

  function remove(i: number) {
    setSamples((prev) => prev.filter((_, idx) => idx !== i));
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink">
            Voice samples
          </h2>
          <p className="text-xs text-muted">
            Real bullets in your own words. Tailoring mirrors these so rewrites
            keep your voice. {samples.length}/{MAX_VOICE_SAMPLES}
          </p>
        </div>
        <SaveButton onClick={save} saving={saving} msg={msg} label="Save voice" />
      </div>

      <div className="space-y-2">
        {samples.map((s, i) => (
          <div key={i} className="flex gap-2">
            <Textarea
              value={s}
              rows={2}
              onChange={(e) => edit(i, e.target.value)}
            />
            <Button
              variant="secondary"
              size="sm"
              className="shrink-0 text-muted"
              onClick={() => remove(i)}
            >
              Remove
            </Button>
          </div>
        ))}
        {samples.length === 0 ? (
          <p className="text-sm text-muted">
            No voice samples yet. Add a few real bullets, or re-harvest from your
            résumé.
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-start gap-2">
        <Textarea
          value={draft}
          rows={2}
          placeholder={
            atCap
              ? `At the ${MAX_VOICE_SAMPLES}-sample limit.`
              : "Paste a real bullet in your voice…"
          }
          disabled={atCap}
          onChange={(e) => setDraft(e.target.value)}
        />
        <Button
          variant="secondary"
          size="sm"
          onClick={add}
          disabled={atCap || !draft.trim()}
        >
          Add
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="ml-auto"
          onClick={() => setSamples(harvestVoiceSamples(currentSections))}
        >
          Re-harvest from résumé
        </Button>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// What tailoring learned (suggestion_edits)
// ---------------------------------------------------------------------------

function LearnedSection({ learned }: { learned: LearnedEdit[] }) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink">
          What tailoring learned
        </h2>
        <p className="text-xs text-muted">
          Recent edits you made to AI suggestions before accepting. The tailor
          mirrors these to match how you actually write.
        </p>
      </div>

      {learned.length ? (
        <ul className="space-y-3">
          {learned.map((e) => (
            <Card key={e.id} className="space-y-1 p-4">
              <p className="text-xs text-faint line-through">{e.ai_suggested}</p>
              <p className="text-sm text-ink">{e.user_final}</p>
            </Card>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">
          Nothing yet. When you edit an AI suggestion before accepting it, it
          shows up here.
        </p>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------

function SaveButton({
  onClick,
  saving,
  msg,
  label,
}: {
  onClick: () => void;
  saving: boolean;
  msg: string | null;
  label: string;
}) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      {msg ? (
        <span
          className={
            msg === "Saved" ? "text-xs text-green-400" : "text-xs text-red-400"
          }
        >
          {msg}
        </span>
      ) : null}
      <Button onClick={onClick} disabled={saving}>
        {saving ? "Saving…" : label}
      </Button>
    </div>
  );
}
