/**
 * Scoring engine types. Every check returns a 0–100 subscore (or a flat point
 * penalty) plus the offending items mapped to concrete fixes, so each deducted
 * point is actionable in the UI. See docs/resume-scoring-spec.md.
 */

export type CategoryKey = "ats" | "keywords" | "impact" | "language";

/** A concrete, clickable remediation for a deduction. */
export interface Fix {
  checkId: string; // e.g. "B1"
  message: string; // human-readable instruction
  item?: string; // the specific offending text, if any
  cost: number; // approximate points recoverable by fixing this
}

export type CheckKind = "subscore" | "penalty" | "info";

export interface CheckResult {
  id: string; // "A1"
  label: string; // "Standard section headers"
  kind: CheckKind;
  /** 0–100 for subscore/info checks. */
  score: number;
  /** Weight within the category for subscore checks (0 for penalty/info). */
  weight: number;
  /** Flat points deducted from the category for penalty checks. */
  penalty: number;
  fixes: Fix[];
  detail?: string;
}

export interface CategoryReport {
  key: CategoryKey;
  label: string;
  /** 0–100. */
  score: number;
  /** Contribution to the total (depends on whether a JD is present). */
  weight: number;
  /** Keywords (B) only contributes when a JD is supplied. */
  applicable: boolean;
  checks: CheckResult[];
  topFixes: Fix[];
}

export interface ScoreReport {
  /** 0–100 weighted total. */
  total: number;
  hasJD: boolean;
  categories: CategoryReport[];
}

/**
 * Folds a category's checks into a 0–100 score: the weighted average of its
 * subscore checks, minus the sum of its penalty points, clamped to [0,100].
 * Also gathers the top 3 fixes by recoverable cost.
 */
export function buildCategory(
  key: CategoryKey,
  label: string,
  weight: number,
  checks: CheckResult[],
  applicable = true
): CategoryReport {
  const subscores = checks.filter((c) => c.kind === "subscore");
  const totalWeight = subscores.reduce((s, c) => s + c.weight, 0);
  const base =
    totalWeight > 0
      ? subscores.reduce((s, c) => s + c.score * c.weight, 0) / totalWeight
      : 100;

  const penalty = checks
    .filter((c) => c.kind === "penalty")
    .reduce((s, c) => s + c.penalty, 0);

  const score = clamp(Math.round(base - penalty), 0, 100);

  const topFixes = checks
    .flatMap((c) => c.fixes)
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 3);

  return { key, label, weight, applicable, checks, score, topFixes };
}

export function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}
