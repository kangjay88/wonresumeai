"use client";

import type { CategoryReport, ScoreReport } from "@/lib/scoring";

function tone(score: number): string {
  if (score >= 80) return "text-green-700";
  if (score >= 60) return "text-amber-600";
  return "text-red-600";
}

function barTone(score: number): string {
  if (score >= 80) return "bg-green-500";
  if (score >= 60) return "bg-amber-500";
  return "bg-red-500";
}

function CategoryRow({ category }: { category: CategoryReport }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{category.label}</span>
        <span className={tone(category.score)}>{category.score}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full rounded-full ${barTone(category.score)}`}
          style={{ width: `${category.score}%` }}
        />
      </div>
      {category.topFixes.length ? (
        <ul className="mt-1 space-y-0.5">
          {category.topFixes.map((fix, i) => (
            <li key={i} className="text-xs leading-snug text-gray-500">
              <span className="font-mono text-[10px] text-gray-400">
                {fix.checkId}
              </span>{" "}
              {fix.message}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function ScorePanel({ report }: { report: ScoreReport }) {
  return (
    <div className="space-y-4 rounded-lg border border-gray-200 p-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-700">
          Resume score
        </h2>
        <div className="flex items-baseline gap-1">
          <span className={`text-3xl font-bold ${tone(report.total)}`}>
            {report.total}
          </span>
          <span className="text-sm text-gray-400">/100</span>
        </div>
      </div>
      <p className="text-xs text-gray-500">
        {report.hasJD
          ? "Scored against the job description."
          : "Base score (no job description). Add a JD in an application for keyword scoring."}
      </p>
      <div className="space-y-3">
        {report.categories.map((c) => (
          <CategoryRow key={c.key} category={c} />
        ))}
      </div>
    </div>
  );
}
