"use client";

import { useMemo, useState } from "react";

import { cn, Select } from "@/components/ui";
import { diffRows, hasChanges, type DiffRow } from "@/lib/diff";
import type { ExperienceEntry, ResumeSections } from "@/lib/types";

import type { VersionItem } from "./version-list";

interface Section {
  title: string;
  rows: DiffRow[];
}

const lines = (s: string) =>
  s.split("\n").map((l) => l.trim()).filter(Boolean);

const roleLabel = (r?: ExperienceEntry) =>
  r ? [r.title, r.company].filter(Boolean).join(" · ") : "";

/** Diff the fields tailoring actually changes: summary, experience bullets
 *  (per role), and skills. Education/projects/contact are untouched by the
 *  tailor flow, so they're omitted to keep the comparison focused. */
function buildSections(a: ResumeSections, b: ResumeSections): Section[] {
  const sections: Section[] = [
    { title: "Summary", rows: diffRows(lines(a.summary), lines(b.summary)) },
  ];

  const roleCount = Math.max(a.experience.length, b.experience.length);
  for (let i = 0; i < roleCount; i++) {
    const ra = a.experience[i];
    const rb = b.experience[i];
    const label = roleLabel(rb) || roleLabel(ra) || `Role ${i + 1}`;
    sections.push({
      title: `Experience — ${label}`,
      rows: diffRows(ra?.bullets ?? [], rb?.bullets ?? []),
    });
  }

  sections.push({ title: "Skills", rows: diffRows(a.skills, b.skills) });
  return sections;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function VersionDiff({ versions }: { versions: VersionItem[] }) {
  // versions arrive newest-first. Default: compare the two most recent.
  const [rightId, setRightId] = useState(versions[0]?.id);
  const [leftId, setLeftId] = useState(versions[1]?.id);
  const [onlyChanges, setOnlyChanges] = useState(true);

  const left = versions.find((v) => v.id === leftId) ?? versions[1];
  const right = versions.find((v) => v.id === rightId) ?? versions[0];

  const sections = useMemo(
    () => (left && right ? buildSections(left.sections, right.sections) : []),
    [left, right],
  );

  const changeCount = useMemo(
    () =>
      sections.reduce(
        (n, s) => n + s.rows.filter((r) => r.type !== "same").length,
        0,
      ),
    [sections],
  );

  if (!left || !right) return null;

  const visible = onlyChanges
    ? sections.filter((s) => hasChanges(s.rows))
    : sections;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-faint">Base</span>
          <Select
            value={leftId}
            onChange={(e) => setLeftId(e.target.value)}
            className="w-auto"
          >
            {versions.map((v) => (
              <option key={v.id} value={v.id}>
                v{v.version} · {fmtDate(v.createdAt)}
              </option>
            ))}
          </Select>
          <span className="text-faint">→</span>
          <Select
            value={rightId}
            onChange={(e) => setRightId(e.target.value)}
            className="w-auto"
          >
            {versions.map((v) => (
              <option key={v.id} value={v.id}>
                v{v.version} · {fmtDate(v.createdAt)}
              </option>
            ))}
          </Select>
        </div>

        <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted">
          <input
            type="checkbox"
            checked={onlyChanges}
            onChange={(e) => setOnlyChanges(e.target.checked)}
            className="accent-brand-500"
          />
          Only changes
        </label>

        <span className="text-xs text-faint">
          {changeCount} change{changeCount === 1 ? "" : "s"}
        </span>
      </div>

      {leftId === rightId ? (
        <p className="rounded-lg border border-dashed border-line p-6 text-center text-sm text-muted">
          Pick two different versions to compare.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-line text-sm">
          <div className="grid grid-cols-2 bg-white/5 text-xs font-semibold">
            <div className="px-3 py-2">
              v{left.version}{" "}
              <span className="font-normal text-faint">
                · {fmtDate(left.createdAt)}
              </span>
            </div>
            <div className="border-l border-line px-3 py-2">
              v{right.version}{" "}
              <span className="font-normal text-faint">
                · {fmtDate(right.createdAt)}
              </span>
            </div>
          </div>

          {visible.length ? (
            visible.map((section) => (
              <DiffSection
                key={section.title}
                section={section}
                onlyChanges={onlyChanges}
              />
            ))
          ) : (
            <p className="px-3 py-6 text-center text-sm text-muted">
              No differences between these versions.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function DiffSection({
  section,
  onlyChanges,
}: {
  section: Section;
  onlyChanges: boolean;
}) {
  const rows = onlyChanges
    ? section.rows.filter((r) => r.type !== "same")
    : section.rows;
  if (!rows.length) return null;

  return (
    <div className="border-t border-line">
      <div className="bg-white/[0.02] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
        {section.title}
      </div>
      {rows.map((row, i) => (
        <Row key={i} row={row} />
      ))}
    </div>
  );
}

function Row({ row }: { row: DiffRow }) {
  const leftTone = row.type === "mod" || row.type === "remove" ? "remove" : "same";
  const rightTone = row.type === "mod" || row.type === "add" ? "add" : "same";
  return (
    <div className="grid grid-cols-2 border-t border-line/60">
      <Cell text={row.left} tone={row.type === "add" ? "empty" : leftTone} marker="−" />
      <Cell
        text={row.right}
        tone={row.type === "remove" ? "empty" : rightTone}
        marker="+"
        className="border-l border-line"
      />
    </div>
  );
}

function Cell({
  text,
  tone,
  marker,
  className,
}: {
  text?: string;
  tone: "add" | "remove" | "same" | "empty";
  marker: string;
  className?: string;
}) {
  const toneClass = {
    add: "bg-green-500/10 text-green-200",
    remove: "bg-red-500/10 text-red-200",
    same: "text-muted",
    empty: "",
  }[tone];
  const changed = tone === "add" || tone === "remove";
  return (
    <div className={cn("flex gap-2 px-3 py-1.5", toneClass, className)}>
      <span
        className={cn(
          "select-none",
          changed ? (tone === "add" ? "text-green-400" : "text-red-400") : "text-transparent",
        )}
      >
        {marker}
      </span>
      <span className="whitespace-pre-wrap break-words">{text ?? ""}</span>
    </div>
  );
}
