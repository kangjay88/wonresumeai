"use client";

import { Fragment, useState } from "react";

import { Button, Card } from "@/components/ui";
import type { JdExtraction, ResumeSections } from "@/lib/types";

import { ApplicationScore } from "./application-score";
import { CoverLetterPanel } from "./cover-letter-panel";
import { TailorPanel } from "./tailor-panel";

const STEPS = [
  { n: 1, label: "Score & JD" },
  { n: 2, label: "Tailor resume" },
  { n: 3, label: "Cover letter" },
] as const;

function CheckIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}

function ChipGroup({ label, items }: { label: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item, i) => (
          <span key={`${item}-${i}`} className="rounded-full bg-white/10 px-2.5 py-1 text-sm">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

export function ApplicationWizard({
  applicationId,
  baseResumeId,
  sections,
  jd,
  jobDescription,
  resumeSaved,
  coverLetterSaved,
}: {
  applicationId: string;
  baseResumeId: string | null;
  sections: ResumeSections;
  jd: JdExtraction | null;
  jobDescription: string;
  resumeSaved: boolean;
  coverLetterSaved: boolean;
}) {
  const [step, setStep] = useState(1);
  const isDone = (n: number) =>
    (n === 2 && resumeSaved) || (n === 3 && coverLetterSaved);

  return (
    <div className="space-y-6">
      {/* Stepper */}
      <Card className="flex items-center px-4 py-3">
        {STEPS.map((s, i) => {
          const active = step === s.n;
          const complete = isDone(s.n);
          return (
            <Fragment key={s.n}>
              <button
                type="button"
                onClick={() => setStep(s.n)}
                className="flex items-center gap-2.5"
              >
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold transition-colors ${
                    complete
                      ? "border-brand-600 bg-brand-600 text-canvas"
                      : active
                        ? "border-brand-500 bg-brand-500/15 text-brand-300"
                        : "border-line text-faint"
                  }`}
                >
                  {complete ? <CheckIcon /> : s.n}
                </span>
                <span
                  className={`hidden text-sm font-medium sm:inline ${
                    active ? "text-ink" : "text-muted"
                  }`}
                >
                  {s.label}
                </span>
              </button>
              {i < STEPS.length - 1 ? (
                <div className="mx-3 h-px flex-1 bg-line" />
              ) : null}
            </Fragment>
          );
        })}
      </Card>

      {/* Step content */}
      <div key={step} className="fade-in">
        {step === 1 ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ApplicationScore
              applicationId={applicationId}
              sections={sections}
              jd={jd}
            />
            <div className="space-y-5">
              {jd ? (
                <div className="space-y-4 rounded-lg border border-line p-4">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-ink">
                    Extracted from the JD
                  </h2>
                  <ChipGroup label="Required skills" items={jd.required_skills} />
                  <ChipGroup label="Preferred skills" items={jd.preferred_skills} />
                  <ChipGroup label="Title variants" items={jd.title_variants} />
                  <ChipGroup label="Seniority signals" items={jd.seniority_signals} />
                  <ChipGroup label="Domain terms" items={jd.domain_terms} />
                </div>
              ) : (
                <p className="text-xs text-faint">
                  JD keyword extraction is unavailable, so the keyword category is
                  excluded from the score.
                </p>
              )}
              <details className="rounded-lg border border-line p-4">
                <summary className="cursor-pointer text-sm font-semibold uppercase tracking-wide text-ink">
                  Job description
                </summary>
                <p className="mt-3 whitespace-pre-wrap text-sm text-muted">
                  {jobDescription}
                </p>
              </details>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <TailorPanel
            applicationId={applicationId}
            baseResumeId={baseResumeId}
            sections={sections}
            jd={jd}
          />
        ) : null}

        {step === 3 ? (
          <CoverLetterPanel applicationId={applicationId} contact={sections.contact} />
        ) : null}
      </div>

      {/* Nav */}
      <div className="flex items-center justify-between border-t border-line pt-4">
        <Button
          variant="secondary"
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1}
        >
          ← Back
        </Button>
        {step < 3 ? (
          <Button onClick={() => setStep((s) => Math.min(3, s + 1))}>
            Next →
          </Button>
        ) : (
          <span className="text-xs text-faint">Final step</span>
        )}
      </div>
    </div>
  );
}
