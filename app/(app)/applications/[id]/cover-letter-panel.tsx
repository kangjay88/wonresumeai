"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { CardSkeleton } from "@/components/skeleton";
import { Button, Input, Textarea } from "@/components/ui";
import { coverLetterFileName } from "@/lib/pdf/filename";
import type {
  Contact,
  CoverLetterContent,
  CoverLetterResult,
} from "@/lib/types";

import { saveCoverLetterVersion } from "./actions";

type Status = "pending" | "accepted" | "rejected";

const DEFAULT_GREETING = "Dear Hiring Manager,";
const CLOSING = "Sincerely,";

export function CoverLetterPanel({
  applicationId,
  contact,
}: {
  applicationId: string;
  contact: Contact;
}) {
  const router = useRouter();
  const [result, setResult] = useState<CoverLetterResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [greeting, setGreeting] = useState(DEFAULT_GREETING);
  const [status, setStatus] = useState<Record<number, Status>>({});
  const [edited, setEdited] = useState<Record<number, string>>({});
  const [editing, setEditing] = useState<number | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const textOf = (i: number, suggested: string) => edited[i] ?? suggested;

  const acceptedParagraphs = useMemo(() => {
    if (!result) return [];
    return result.paragraphs
      .map((p, i) => ({ i, text: textOf(i, p.suggested) }))
      .filter(({ i }) => status[i] === "accepted")
      .map(({ text }) => text);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, status, edited]);

  const content: CoverLetterContent = {
    contact,
    greeting,
    paragraphs: acceptedParagraphs,
    closing: CLOSING,
  };

  async function generate() {
    setLoading(true);
    setError(null);
    setSaveMsg(null);
    try {
      const res = await fetch("/api/ai/cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Generation failed.");
        return;
      }
      setResult(data as CoverLetterResult);
      setStatus({});
      setEdited({});
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    setSaving(true);
    setSaveMsg(null);
    const out = await saveCoverLetterVersion({ applicationId, content });
    setSaving(false);
    if (out.ok) {
      setSaveMsg(`Saved cover letter version ${out.version}.`);
      router.refresh();
    } else {
      setSaveMsg(out.error);
    }
  }

  async function download() {
    const [{ pdf }, { CoverLetterDocument }] = await Promise.all([
      import("@react-pdf/renderer"),
      import("@/lib/pdf/cover-letter-document"),
    ]);
    const blob = await pdf(<CoverLetterDocument content={content} />).toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = coverLetterFileName(contact.name);
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  if (!result) {
    return (
      <div className="space-y-3 rounded-lg border border-line p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink">
          Cover letter
        </h2>
        <p className="text-sm text-muted">
          Generate a cover letter in your voice from your tailored resume and
          this job — resume-backed, no fabricated claims.
        </p>
        <Button onClick={generate} disabled={loading}>
          {loading ? "Writing…" : "Generate cover letter"}
        </Button>
        {loading ? (
          <div className="space-y-3 pt-2">
            <CardSkeleton lines={3} />
            <CardSkeleton lines={3} />
          </div>
        ) : null}
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-lg border border-line p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink">
          Cover letter
        </h2>
        <span className="text-xs text-faint">
          {acceptedParagraphs.length} paragraph(s) accepted
        </span>
      </div>

      <label className="block space-y-1">
        <span className="text-xs font-medium text-muted">Greeting</span>
        <Input value={greeting} onChange={(e) => setGreeting(e.target.value)} />
      </label>

      {result.paragraphs.map((p, i) => {
        const st = status[i] ?? "pending";
        const isEditing = editing === i;
        return (
          <div
            key={i}
            className={`space-y-2 rounded-md border border-line p-3 ${st === "rejected" ? "opacity-50" : ""}`}
          >
            {isEditing ? (
              <Textarea
                value={textOf(i, p.suggested)}
                rows={4}
                onChange={(e) => setEdited((prev) => ({ ...prev, [i]: e.target.value }))}
              />
            ) : (
              <p className="text-sm">{textOf(i, p.suggested)}</p>
            )}
            {p.reasoning ? <p className="text-xs text-muted">{p.reasoning}</p> : null}

            {isEditing ? (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    setStatus((s) => ({ ...s, [i]: "accepted" }));
                    setEditing(null);
                  }}
                >
                  Accept edited
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
              </div>
            ) : st === "accepted" ? (
              <div className="flex items-center gap-2 text-xs">
                <span className="font-medium text-green-400">Accepted</span>
                <button
                  onClick={() => setStatus((s) => ({ ...s, [i]: "pending" }))}
                  className="text-faint hover:text-ink"
                >
                  Undo
                </button>
              </div>
            ) : st === "rejected" ? (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-faint">Rejected</span>
                <button
                  onClick={() => setStatus((s) => ({ ...s, [i]: "pending" }))}
                  className="text-faint hover:text-ink"
                >
                  Undo
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => setStatus((s) => ({ ...s, [i]: "accepted" }))}
                >
                  Accept
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setEditing(i)}>
                  Edit
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="text-muted"
                  onClick={() => setStatus((s) => ({ ...s, [i]: "rejected" }))}
                >
                  Reject
                </Button>
              </div>
            )}
          </div>
        );
      })}

      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-3">
        <Button
          onClick={save}
          disabled={saving || acceptedParagraphs.length === 0}
        >
          {saving ? "Saving…" : "Save cover letter"}
        </Button>
        <Button
          variant="secondary"
          onClick={download}
          disabled={acceptedParagraphs.length === 0}
        >
          Download PDF
        </Button>
        <button
          type="button"
          onClick={generate}
          disabled={loading}
          className="text-sm text-muted hover:text-ink"
        >
          Regenerate
        </button>
        {saveMsg ? <span className="text-sm text-green-400">{saveMsg}</span> : null}
      </div>
    </div>
  );
}
