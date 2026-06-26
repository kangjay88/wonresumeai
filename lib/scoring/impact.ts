import type { ResumeSections } from "@/lib/types";

import type { CheckResult, Fix } from "./types";
import {
  allBullets,
  firstWord,
  hasDigit,
  hasScopeSignal,
  STRONG_VERBS,
  wordCount,
} from "./util";

/** Deterministic proxy for bullet strength (stands in for the C2 LLM rubric). */
export function bulletStrength(text: string): number {
  let s = 0;
  if (hasDigit(text)) s += 2;
  if (STRONG_VERBS.has(firstWord(text))) s += 1;
  if (hasScopeSignal(text)) s += 1;
  const w = wordCount(text);
  if (w >= 8 && w <= 24) s += 1;
  return s;
}

// C1 — quantification rate (recent roles weighted 2×) ------------------------
function quantification(sections: ResumeSections): CheckResult {
  const bullets = allBullets(sections);
  if (!bullets.length) {
    return {
      id: "C1",
      label: "Quantification rate",
      kind: "subscore",
      score: 0,
      weight: 0.5,
      penalty: 0,
      fixes: [{ checkId: "C1", message: "Add achievement bullets with measurable outcomes.", cost: 25 }],
      detail: "No bullets to quantify",
    };
  }
  const weight = (b: { recent: boolean }) => (b.recent ? 2 : 1);
  const total = bullets.reduce((s, b) => s + weight(b), 0);
  const quantified = bullets.reduce((s, b) => s + (hasDigit(b.text) ? weight(b) : 0), 0);
  const rate = quantified / total;
  const score = Math.min(100, Math.round((rate / 0.6) * 100));

  const fixes: Fix[] = bullets
    .filter((b) => b.recent && !hasDigit(b.text))
    .slice(0, 4)
    .map((b) => ({
      checkId: "C1",
      message: "Add a number, %, $, or scale to this bullet (or flag it needs one).",
      item: b.text,
      cost: 8,
    }));

  return {
    id: "C1",
    label: "Quantification rate",
    kind: "subscore",
    score,
    weight: 0.5,
    penalty: 0,
    fixes,
    detail: `${Math.round(rate * 100)}% of bullets quantified (target ≥60%)`,
  };
}

// C4 — scope signals in recent roles -----------------------------------------
function scopeSignals(sections: ResumeSections): CheckResult {
  const recent = allBullets(sections).filter((b) => b.recent);
  const withScope = recent.filter((b) => hasScopeSignal(b.text)).length;
  const score = withScope >= 2 ? 100 : withScope === 1 ? 60 : 20;
  return {
    id: "C4",
    label: "Scope signals",
    kind: "subscore",
    score,
    weight: 0.25,
    penalty: 0,
    fixes:
      withScope >= 2
        ? []
        : [
            {
              checkId: "C4",
              message: "Add scale to recent bullets (team size, user/request counts, budget) in ≥2 bullets.",
              cost: 12,
            },
          ],
    detail: `${withScope} recent bullet(s) signal scope`,
  };
}

// C5 — front-loaded impact (strongest bullet first in each role) -------------
function frontLoaded(sections: ResumeSections): CheckResult {
  let rolesWithMulti = 0;
  let violations = 0;
  const fixes: Fix[] = [];
  sections.experience.forEach((role) => {
    const bullets = role.bullets.filter((b) => b.trim());
    if (bullets.length < 2) return;
    rolesWithMulti += 1;
    const strengths = bullets.map(bulletStrength);
    const max = Math.max(...strengths);
    if (strengths[0] < max) {
      violations += 1;
      fixes.push({
        checkId: "C5",
        message: `Lead "${role.title || role.company}" with its strongest bullet (recruiters skim the first line).`,
        cost: 10,
      });
    }
  });
  const score = rolesWithMulti
    ? Math.round(((rolesWithMulti - violations) / rolesWithMulti) * 100)
    : 100;
  return {
    id: "C5",
    label: "Front-loaded impact",
    kind: "subscore",
    score,
    weight: 0.25,
    penalty: 0,
    fixes,
    detail: rolesWithMulti
      ? `${rolesWithMulti - violations}/${rolesWithMulti} roles lead with their strongest bullet`
      : "No multi-bullet roles",
  };
}

/**
 * Deterministic impact checks (C1, C4, C5). C2/C3 are LLM-rubric scores layered
 * in by the rubric-score route in Phase 4; they aren't computed here.
 */
export function scoreImpact(sections: ResumeSections): CheckResult[] {
  return [quantification(sections), scopeSignals(sections), frontLoaded(sections)];
}
