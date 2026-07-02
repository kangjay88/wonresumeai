"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { CardSkeleton } from "@/components/skeleton";
import { Badge, Button, Textarea } from "@/components/ui";
import { scoreResume } from "@/lib/scoring";
import type {
  JdExtraction,
  ResumeSections,
  TailorBullet,
  TailorResult,
} from "@/lib/types";

import { saveTailoredVersion, type SuggestionEditPair } from "./actions";

type Status = "pending" | "accepted" | "rejected";

export function TailorPanel({
  applicationId,
  baseResumeId,
  sections,
  jd,
}: {
  applicationId: string;
  baseResumeId: string | null;
  sections: ResumeSections;
  jd: JdExtraction | null;
}) {
  const router = useRouter();
  const [result, setResult] = useState<TailorResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [status, setStatus] = useState<Record<string, Status>>({});
  const [edited, setEdited] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const finalText = (id: string, suggested: string) => edited[id] ?? suggested;
  const isAccepted = (id: string) => status[id] === "accepted";

  // Compose accepted suggestions onto a working copy of the resume.
  const working = useMemo<ResumeSections>(() => {
    const next = structuredClone(sections);
    if (!result) return next;

    if (result.summary && isAccepted("summary")) {
      next.summary = finalText("summary", result.summary.suggested);
    }
    for (const b of result.bullets) {
      const id = `b:${b.role_index}:${b.bullet_index}`;
      if (isAccepted(id) && next.experience[b.role_index]?.bullets[b.bullet_index] !== undefined) {
        next.experience[b.role_index].bullets[b.bullet_index] = finalText(id, b.suggested);
      }
    }
    for (const skill of result.skills_to_add) {
      if (isAccepted(`add:${skill}`) && !next.skills.some((s) => s.toLowerCase() === skill.toLowerCase())) {
        next.skills.push(skill);
      }
    }
    for (const skill of result.skills_to_remove) {
      if (isAccepted(`rm:${skill}`)) {
        next.skills = next.skills.filter((s) => s.toLowerCase() !== skill.toLowerCase());
      }
    }
    return next;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections, result, status, edited]);

  const baseReport = useMemo(() => scoreResume(sections, jd), [sections, jd]);
  const workingReport = useMemo(() => scoreResume(working, jd), [working, jd]);
  const delta = workingReport.total - baseReport.total;

  const acceptedCount = Object.values(status).filter((s) => s === "accepted").length;

  async function runTailor() {
    setLoading(true);
    setError(null);
    setSaveMsg(null);
    try {
      const res = await fetch("/api/ai/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Tailoring failed.");
        return;
      }
      setResult(data as TailorResult);
      setStatus({});
      setEdited({});
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    if (!result) return;
    setSaving(true);
    setSaveMsg(null);

    const edits: SuggestionEditPair[] = [];
    if (result.summary && isAccepted("summary") && edited["summary"]) {
      edits.push({ ai_suggested: result.summary.suggested, user_final: edited["summary"] });
    }
    for (const b of result.bullets) {
      const id = `b:${b.role_index}:${b.bullet_index}`;
      if (isAccepted(id) && edited[id]) {
        edits.push({ ai_suggested: b.suggested, user_final: edited[id] });
      }
    }

    const snapshot = {
      total: workingReport.total,
      categories: workingReport.categories.map((c) => ({
        key: c.key,
        label: c.label,
        score: c.score,
      })),
    };

    const out = await saveTailoredVersion({
      applicationId,
      baseResumeId,
      sections: working,
      score: snapshot,
      edits,
    });
    setSaving(false);
    if (out.ok) {
      setSaveMsg(`Saved version ${out.version}.`);
      router.refresh();
    } else {
      setSaveMsg(out.error);
    }
  }

  if (!result) {
    return (
      <div className="space-y-3 rounded-lg border border-line p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink">
          Tailor to this job
        </h2>
        <p className="text-sm text-muted">
          Generate voice-preserving suggestions that surface the job&apos;s
          keywords and strengthen weak bullets — never fabricating metrics.
        </p>
        <Button onClick={runTailor} disabled={loading}>
          {loading ? "Tailoring…" : "Tailor resume"}
        </Button>
        {loading ? (
          <div className="space-y-3 pt-2">
            <CardSkeleton lines={2} />
            <CardSkeleton lines={2} />
            <CardSkeleton lines={2} />
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
          Suggestions
        </h2>
        <div className="text-right text-sm">
          <span className="font-semibold">{workingReport.total}</span>
          <span className="text-faint">/100 </span>
          <span className={delta > 0 ? "text-green-400" : "text-faint"}>
            {delta > 0 ? `+${delta}` : delta}
          </span>
        </div>
      </div>

      {/* Summary */}
      {result.summary ? (
        <SuggestionCard
          title="Summary"
          original={result.summary.original}
          suggested={finalText("summary", result.summary.suggested)}
          reasoning={result.summary.reasoning}
          status={status["summary"] ?? "pending"}
          editing={editing === "summary"}
          onAccept={() => setStatus((s) => ({ ...s, summary: "accepted" }))}
          onReject={() => setStatus((s) => ({ ...s, summary: "rejected" }))}
          onEdit={() => setEditing("summary")}
          onEditChange={(v) => setEdited((e) => ({ ...e, summary: v }))}
          onEditSave={() => {
            setStatus((s) => ({ ...s, summary: "accepted" }));
            setEditing(null);
          }}
          onEditCancel={() => setEditing(null)}
          onUndo={() => setStatus((s) => ({ ...s, summary: "pending" }))}
        />
      ) : null}

      {/* Bullets */}
      {result.bullets.map((b) => {
        const id = `b:${b.role_index}:${b.bullet_index}`;
        return (
          <BulletCard
            key={id}
            bullet={b}
            roleLabel={sections.experience[b.role_index]?.title ?? `Role ${b.role_index}`}
            suggested={finalText(id, b.suggested)}
            status={status[id] ?? "pending"}
            editing={editing === id}
            onAccept={() => setStatus((s) => ({ ...s, [id]: "accepted" }))}
            onReject={() => setStatus((s) => ({ ...s, [id]: "rejected" }))}
            onEdit={() => setEditing(id)}
            onEditChange={(v) => setEdited((e) => ({ ...e, [id]: v }))}
            onEditSave={() => {
              setStatus((s) => ({ ...s, [id]: "accepted" }));
              setEditing(null);
            }}
            onEditCancel={() => setEditing(null)}
            onUndo={() => setStatus((s) => ({ ...s, [id]: "pending" }))}
          />
        );
      })}

      {/* Skills */}
      {result.skills_to_add.length || result.skills_to_remove.length ? (
        <div className="space-y-2 rounded-md border border-line p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Skills
          </p>
          <div className="flex flex-wrap gap-2">
            {result.skills_to_add.map((s) => (
              <SkillChip
                key={`add:${s}`}
                label={`+ ${s}`}
                accepted={isAccepted(`add:${s}`)}
                rejected={status[`add:${s}`] === "rejected"}
                onAccept={() => setStatus((st) => ({ ...st, [`add:${s}`]: "accepted" }))}
                onReject={() => setStatus((st) => ({ ...st, [`add:${s}`]: "rejected" }))}
                onReset={() => setStatus((st) => ({ ...st, [`add:${s}`]: "pending" }))}
              />
            ))}
            {result.skills_to_remove.map((s) => (
              <SkillChip
                key={`rm:${s}`}
                label={`− ${s}`}
                accepted={isAccepted(`rm:${s}`)}
                rejected={status[`rm:${s}`] === "rejected"}
                onAccept={() => setStatus((st) => ({ ...st, [`rm:${s}`]: "accepted" }))}
                onReject={() => setStatus((st) => ({ ...st, [`rm:${s}`]: "rejected" }))}
                onReset={() => setStatus((st) => ({ ...st, [`rm:${s}`]: "pending" }))}
              />
            ))}
          </div>
        </div>
      ) : null}

      {/* Save */}
      <div className="flex items-center gap-3 border-t border-line pt-3">
        <Button onClick={save} disabled={saving || acceptedCount === 0}>
          {saving ? "Saving…" : `Save version (${acceptedCount} accepted)`}
        </Button>
        <button
          type="button"
          onClick={runTailor}
          disabled={loading}
          className="text-sm text-muted hover:text-ink"
        >
          Re-tailor
        </button>
        {saveMsg ? <span className="text-sm text-green-400">{saveMsg}</span> : null}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Cards
// ---------------------------------------------------------------------------

interface CardActions {
  status: Status;
  editing: boolean;
  onAccept: () => void;
  onReject: () => void;
  onEdit: () => void;
  onEditChange: (v: string) => void;
  onEditSave: () => void;
  onEditCancel: () => void;
  onUndo: () => void;
}

function ActionRow({
  status,
  editing,
  onAccept,
  onReject,
  onEdit,
  onUndo,
}: Pick<CardActions, "status" | "editing" | "onAccept" | "onReject" | "onEdit" | "onUndo">) {
  if (editing) return null;
  if (status === "accepted")
    return (
      <div className="flex items-center gap-2 text-xs">
        <span className="font-medium text-green-400">Accepted</span>
        <button onClick={onUndo} className="text-faint hover:text-ink">
          Undo
        </button>
      </div>
    );
  if (status === "rejected")
    return (
      <div className="flex items-center gap-2 text-xs">
        <span className="text-faint">Rejected</span>
        <button onClick={onUndo} className="text-faint hover:text-ink">
          Undo
        </button>
      </div>
    );
  return (
    <div className="flex gap-2">
      <Button size="sm" onClick={onAccept}>
        Accept
      </Button>
      <Button variant="secondary" size="sm" onClick={onEdit}>
        Edit
      </Button>
      <Button variant="secondary" size="sm" className="text-muted" onClick={onReject}>
        Reject
      </Button>
    </div>
  );
}

function EditArea({
  value,
  onChange,
  onSave,
  onCancel,
}: {
  value: string;
  onChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-2">
      <Textarea value={value} rows={3} onChange={(e) => onChange(e.target.value)} />
      <div className="flex gap-2">
        <Button size="sm" onClick={onSave}>
          Accept edited
        </Button>
        <Button variant="secondary" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function SuggestionCard({
  title,
  original,
  suggested,
  reasoning,
  ...actions
}: {
  title: string;
  original: string;
  suggested: string;
  reasoning: string;
} & CardActions) {
  const dim = actions.status === "rejected";
  return (
    <div className={`space-y-2 rounded-md border border-line p-3 ${dim ? "opacity-50" : ""}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{title}</p>
      {original ? <p className="text-sm text-faint line-through">{original}</p> : null}
      {actions.editing ? (
        <EditArea
          value={suggested}
          onChange={actions.onEditChange}
          onSave={actions.onEditSave}
          onCancel={actions.onEditCancel}
        />
      ) : (
        <p className="text-sm">{suggested}</p>
      )}
      {reasoning ? <p className="text-xs text-muted">{reasoning}</p> : null}
      <ActionRow {...actions} />
    </div>
  );
}

function BulletCard({
  bullet,
  roleLabel,
  suggested,
  ...actions
}: {
  bullet: TailorBullet;
  roleLabel: string;
  suggested: string;
} & CardActions) {
  const dim = actions.status === "rejected";
  return (
    <div className={`space-y-2 rounded-md border border-line p-3 ${dim ? "opacity-50" : ""}`}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{roleLabel}</p>
        {bullet.score_delta > 0 ? (
          <span className="text-xs text-green-400">+{bullet.score_delta}</span>
        ) : null}
      </div>
      {bullet.original ? (
        <p className="text-sm text-faint line-through">{bullet.original}</p>
      ) : null}
      {actions.editing ? (
        <EditArea
          value={suggested}
          onChange={actions.onEditChange}
          onSave={actions.onEditSave}
          onCancel={actions.onEditCancel}
        />
      ) : (
        <p className="text-sm">{suggested}</p>
      )}
      {bullet.needs_input ? (
        <p className="rounded bg-amber-500/10 px-2 py-1 text-xs text-amber-300">
          Needs your input: {bullet.needs_input} (use Edit to add the real number)
        </p>
      ) : null}
      {bullet.keywords_addressed.length ? (
        <div className="flex flex-wrap gap-1">
          {bullet.keywords_addressed.map((k, i) => (
            <Badge key={i}>{k}</Badge>
          ))}
        </div>
      ) : null}
      {bullet.reasoning ? <p className="text-xs text-muted">{bullet.reasoning}</p> : null}
      <ActionRow {...actions} />
    </div>
  );
}

function SkillChip({
  label,
  accepted,
  rejected,
  onAccept,
  onReject,
  onReset,
}: {
  label: string;
  accepted: boolean;
  rejected: boolean;
  onAccept: () => void;
  onReject: () => void;
  onReset: () => void;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-sm ${
        accepted
          ? "border-green-300 bg-green-50 text-green-300"
          : rejected
            ? "border-line text-faint line-through"
            : "border-line"
      }`}
    >
      {label}
      {!accepted && !rejected ? (
        <>
          <button onClick={onAccept} className="text-green-600" aria-label="Accept">
            ✓
          </button>
          <button onClick={onReject} className="text-faint" aria-label="Reject">
            ×
          </button>
        </>
      ) : (
        <button onClick={onReset} className="text-faint">
          undo
        </button>
      )}
    </span>
  );
}
