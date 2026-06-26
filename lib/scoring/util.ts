import type { ResumeSections } from "@/lib/types";

import synonymData from "./synonyms.json";

// ---------------------------------------------------------------------------
// Lexicons
// ---------------------------------------------------------------------------

/** Strong action verbs for D1 / bullet-strength (base forms, lowercase). */
export const STRONG_VERBS = new Set([
  "led", "built", "architected", "designed", "developed", "created", "launched",
  "shipped", "delivered", "migrated", "reduced", "increased", "improved",
  "optimized", "automated", "scaled", "implemented", "engineered", "drove",
  "owned", "spearheaded", "managed", "mentored", "directed", "established",
  "founded", "redesigned", "rebuilt", "refactored", "streamlined", "accelerated",
  "boosted", "cut", "saved", "generated", "grew", "expanded", "transformed",
  "modernized", "integrated", "deployed", "released", "introduced", "pioneered",
  "negotiated", "secured", "resolved", "debugged", "diagnosed", "analyzed",
  "researched", "prototyped", "tested", "validated", "documented", "coordinated",
  "facilitated", "trained", "coached", "hired", "recruited", "championed",
  "orchestrated", "consolidated", "eliminated", "minimized", "maximized",
  "enhanced", "enabled", "authored", "produced", "wrote", "presented",
]);

/** Weak openers (D2) — matched at the start of a bullet, lowercase. */
export const WEAK_OPENERS = [
  "responsible for", "helped", "worked on", "assisted with", "duties included",
  "tasked with", "responsible of", "in charge of", "involved in",
];

/** Clichés / buzzwords (D4). */
export const CLICHES = [
  "results-driven", "results driven", "team player", "go-getter", "go getter",
  "synergy", "passionate about", "detail-oriented", "detail oriented",
  "self-starter", "self starter", "think outside the box", "hard worker",
  "fast learner", "dynamic", "proactively", "best of breed",
];

/** AI-tell vocabulary (D5): word → max allowed occurrences before penalty. */
export const AI_TELLS: { word: string; max: number }[] = [
  { word: "spearheaded", max: 1 },
  { word: "leveraged", max: 2 },
  { word: "leverage", max: 2 },
  { word: "delve", max: 0 },
  { word: "delved", max: 0 },
  { word: "utilize", max: 0 },
  { word: "utilized", max: 0 },
  { word: "honed", max: 0 },
  { word: "showcasing", max: 0 },
  { word: "showcase", max: 0 },
];

/** Scope-signal patterns (C4): team size, user/request counts, budget. */
export const SCOPE_PATTERNS: RegExp[] = [
  /\bteam of \d+/i,
  /\b\d[\d,.]*\s*\+?\s*(users|customers|clients|members|developers|engineers|people|employees)\b/i,
  /\b\d[\d,.]*\s*(k|m|b|million|billion|thousand)?\s*\+?\s*(requests|queries|transactions|rps|qps|events|records|rows)\b/i,
  /\$\s?\d[\d,.]*\s*(k|m|b|million|billion)?\b/i,
  /\b\d+\s*(microservices|services|repositories|repos|regions|data centers)\b/i,
];

const synonyms = synonymData as unknown as {
  groups: string[][];
  acronyms: string[][];
};

// ---------------------------------------------------------------------------
// Text helpers
// ---------------------------------------------------------------------------

export function normalize(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Whole-term presence test that tolerates `+`, `#`, `.`, `/` inside terms
 * (so "c++", "ci/cd", ".net", "node.js" match correctly).
 */
export function termPresent(term: string, text: string): boolean {
  const t = term.toLowerCase().trim();
  if (!t) return false;
  const re = new RegExp(
    `(?<![a-z0-9+#./])${escapeRegExp(t)}(?![a-z0-9+#./])`,
    "i"
  );
  return re.test(text);
}

export function countOccurrences(term: string, text: string): number {
  const t = term.toLowerCase().trim();
  if (!t) return 0;
  const re = new RegExp(
    `(?<![a-z0-9+#./])${escapeRegExp(t)}(?![a-z0-9+#./])`,
    "gi"
  );
  return (text.match(re) ?? []).length;
}

/** All surface forms of a skill, drawn from the synonym groups. */
export function expandSkill(skill: string): string[] {
  const s = normalize(skill);
  for (const group of synonyms.groups) {
    if (group.some((g) => normalize(g) === s)) {
      return group;
    }
  }
  return [skill];
}

/** True if the skill (any synonym form) appears in the text. */
export function skillPresent(skill: string, text: string): boolean {
  return expandSkill(skill).some((form) => termPresent(form, text));
}

export const ACRONYM_PAIRS = synonyms.acronyms;

// ---------------------------------------------------------------------------
// Resume helpers
// ---------------------------------------------------------------------------

export interface BulletRef {
  text: string;
  roleIndex: number; // -1 for project bullets
  bulletIndex: number;
  recent: boolean; // among the two most recent experience roles
}

/** Experience + project bullets, flattened, with recency flags. */
export function allBullets(sections: ResumeSections): BulletRef[] {
  const refs: BulletRef[] = [];
  sections.experience.forEach((role, roleIndex) => {
    role.bullets.forEach((text, bulletIndex) => {
      const t = text.trim();
      if (t) {
        refs.push({ text: t, roleIndex, bulletIndex, recent: roleIndex < 2 });
      }
    });
  });
  sections.projects.forEach((proj) => {
    proj.bullets.forEach((text, bulletIndex) => {
      const t = text.trim();
      if (t) refs.push({ text: t, roleIndex: -1, bulletIndex, recent: false });
    });
  });
  return refs;
}

/** The full text corpus of a resume, normalized — used for keyword matching. */
export function resumeCorpus(sections: ResumeSections): string {
  const parts: string[] = [sections.summary];
  sections.experience.forEach((r) => {
    parts.push(r.title, r.company, ...r.bullets);
  });
  sections.projects.forEach((p) => {
    parts.push(p.name, p.description, ...p.bullets);
  });
  parts.push(...sections.skills);
  sections.education.forEach((e) => parts.push(e.degree, e.field, e.school));
  return normalize(parts.join(" \n "));
}

/** Just the bullet text corpus (for B3 placement quality). */
export function bulletCorpus(sections: ResumeSections): string {
  return normalize(allBullets(sections).map((b) => b.text).join(" \n "));
}

export function skillsCorpus(sections: ResumeSections): string {
  return normalize(sections.skills.join(" \n "));
}

export function firstWord(bullet: string): string {
  const m = bullet.trim().match(/^[A-Za-z']+/);
  return m ? m[0].toLowerCase() : "";
}

export function wordCount(s: string): number {
  const t = s.trim();
  return t ? t.split(/\s+/).length : 0;
}

export function hasDigit(s: string): boolean {
  return /\d/.test(s);
}

export function hasScopeSignal(s: string): boolean {
  return SCOPE_PATTERNS.some((re) => re.test(s));
}

/**
 * Parses "MMM YYYY" / "Present" to a comparable month ordinal (year*12+month).
 * Returns null for unparseable. "Present" → Infinity (most recent).
 */
const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

export function parseMonthYear(s: string): number | null {
  const v = s.trim().toLowerCase();
  if (!v) return null;
  if (v === "present" || v === "current") return Number.POSITIVE_INFINITY;
  const m = v.match(/^([a-z]{3})[a-z]*\.?\s+(\d{4})$/);
  if (!m) return null;
  const month = MONTHS[m[1]];
  if (month === undefined) return null;
  return Number(m[2]) * 12 + month;
}

export const DATE_FORMAT_RE = /^[A-Z][a-z]{2,}\.?\s+\d{4}$/;
export function isValidDateToken(s: string): boolean {
  const v = s.trim();
  return v === "Present" || v === "Current" || DATE_FORMAT_RE.test(v);
}
