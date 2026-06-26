import type { ResumeSections } from "@/lib/types";

import type { CheckResult, Fix } from "./types";
import {
  AI_TELLS,
  allBullets,
  CLICHES,
  countOccurrences,
  firstWord,
  normalize,
  STRONG_VERBS,
  WEAK_OPENERS,
  wordCount,
} from "./util";

function languageCorpus(sections: ResumeSections): string {
  return normalize(
    [sections.summary, ...allBullets(sections).map((b) => b.text)].join(" \n ")
  );
}

// D1 — action-verb starts (subscore, the category base) ----------------------
function actionVerbs(sections: ResumeSections): CheckResult {
  const bullets = allBullets(sections);
  if (!bullets.length) {
    return { id: "D1", label: "Action-verb starts", kind: "subscore", score: 100, weight: 1, penalty: 0, fixes: [], detail: "No bullets" };
  }
  const strong = bullets.filter((b) => STRONG_VERBS.has(firstWord(b.text)));
  const weak = bullets.filter((b) => !STRONG_VERBS.has(firstWord(b.text)));
  const fixes: Fix[] = weak.slice(0, 4).map((b) => ({
    checkId: "D1",
    message: "Start this bullet with a strong action verb (led, built, reduced…).",
    item: b.text,
    cost: 5,
  }));
  return {
    id: "D1",
    label: "Action-verb starts",
    kind: "subscore",
    score: Math.round((strong.length / bullets.length) * 100),
    weight: 1,
    penalty: 0,
    fixes,
    detail: `${strong.length}/${bullets.length} bullets start with a strong verb`,
  };
}

// D2 — weak-opener blacklist (penalty) ---------------------------------------
function weakOpeners(sections: ResumeSections): CheckResult {
  const bullets = allBullets(sections);
  const fixes: Fix[] = [];
  let count = 0;
  for (const b of bullets) {
    const n = normalize(b.text);
    const opener = WEAK_OPENERS.find((w) => n.startsWith(w));
    if (opener) {
      count += 1;
      fixes.push({ checkId: "D2", message: `Rewrite "${opener}…" to lead with an action verb.`, item: b.text, cost: 8 });
    }
  }
  return { id: "D2", label: "Weak-opener blacklist", kind: "penalty", score: 0, weight: 0, penalty: count * 8, fixes, detail: count ? `${count} weak opener(s)` : "None" };
}

// D3 — verb diversity (penalty) ----------------------------------------------
function verbDiversity(sections: ResumeSections): CheckResult {
  const counts = new Map<string, number>();
  for (const b of allBullets(sections)) {
    const v = firstWord(b.text);
    if (v) counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  let excess = 0;
  const fixes: Fix[] = [];
  for (const [verb, c] of counts) {
    if (c > 2) {
      excess += c - 2;
      fixes.push({ checkId: "D3", message: `"${verb}" opens ${c} bullets — vary the verb.`, item: verb, cost: 5 });
    }
  }
  return { id: "D3", label: "Verb diversity", kind: "penalty", score: 0, weight: 0, penalty: excess * 5, fixes, detail: excess ? `${excess} repeated opener(s)` : "Good variety" };
}

// D4 — cliché & buzzword filter (penalty) ------------------------------------
function cliches(sections: ResumeSections): CheckResult {
  const corpus = languageCorpus(sections);
  const fixes: Fix[] = [];
  let count = 0;
  for (const c of CLICHES) {
    const n = countOccurrences(c, corpus);
    if (n > 0) {
      count += n;
      fixes.push({ checkId: "D4", message: `Remove the cliché "${c}".`, item: c, cost: 5 });
    }
  }
  return { id: "D4", label: "Cliché & buzzword filter", kind: "penalty", score: 0, weight: 0, penalty: count * 5, fixes, detail: count ? `${count} cliché(s)` : "None" };
}

// D5 — AI-tell filter (penalty) ----------------------------------------------
function aiTells(sections: ResumeSections): CheckResult {
  const corpus = languageCorpus(sections);
  const fixes: Fix[] = [];
  let breaches = 0;
  for (const { word, max } of AI_TELLS) {
    const n = countOccurrences(word, corpus);
    if (n > max) {
      breaches += 1;
      fixes.push({
        checkId: "D5",
        message: `"${word}" appears ${n}× (max ${max}) — reads as AI-written. Replace it.`,
        item: word,
        cost: 5,
      });
    }
  }
  return { id: "D5", label: "AI-tell filter", kind: "penalty", score: 0, weight: 0, penalty: breaches * 5, fixes, detail: breaches ? `${breaches} AI-tell breach(es)` : "None" };
}

// D6 — bullet length (penalty) -----------------------------------------------
function bulletLength(sections: ResumeSections): CheckResult {
  const bullets = allBullets(sections);
  const fixes: Fix[] = [];
  let count = 0;
  for (const b of bullets) {
    const w = wordCount(b.text);
    if (w < 8 || w > 24) {
      count += 1;
      if (fixes.length < 4)
        fixes.push({
          checkId: "D6",
          message: `${w < 8 ? "Expand" : "Tighten"} this bullet to 8–24 words (currently ${w}).`,
          item: b.text,
          cost: 5,
        });
    }
  }
  return { id: "D6", label: "Bullet length", kind: "penalty", score: 0, weight: 0, penalty: count * 5, fixes, detail: count ? `${count} bullet(s) outside 8–24 words` : "All within range" };
}

// D7 — bullet count per role (penalty) ---------------------------------------
function bulletCountPerRole(sections: ResumeSections): CheckResult {
  const fixes: Fix[] = [];
  let violations = 0;
  sections.experience.forEach((role, i) => {
    const n = role.bullets.filter((b) => b.trim()).length;
    const label = role.title || role.company || `role ${i + 1}`;
    if (n > 8) {
      violations += 1;
      fixes.push({ checkId: "D7", message: `${label} has ${n} bullets (>8) — cut to the strongest.`, cost: 5 });
    } else if (i === 0 && (n < 4 || n > 6)) {
      violations += 1;
      fixes.push({ checkId: "D7", message: `Most-recent role should have 4–6 bullets (has ${n}).`, cost: 5 });
    } else if (i > 0 && n > 0 && (n < 2 || n > 4)) {
      violations += 1;
      fixes.push({ checkId: "D7", message: `${label} should have 2–4 bullets (has ${n}).`, cost: 5 });
    }
  });
  return { id: "D7", label: "Bullet count per role", kind: "penalty", score: 0, weight: 0, penalty: violations * 5, fixes, detail: violations ? `${violations} role(s) off the bullet-count guideline` : "Within guidelines" };
}

// D9 — no first person (penalty) ---------------------------------------------
function noFirstPerson(sections: ResumeSections): CheckResult {
  const corpus = languageCorpus(sections);
  const count =
    countOccurrences("i", corpus) +
    countOccurrences("my", corpus) +
    countOccurrences("me", corpus);
  return {
    id: "D9",
    label: "No first person",
    kind: "penalty",
    score: 0,
    weight: 0,
    penalty: Math.min(20, count * 5),
    fixes: count
      ? [{ checkId: "D9", message: 'Remove first-person words ("I", "my", "me") from bullets.', cost: 5 }]
      : [],
    detail: count ? `${count} first-person word(s)` : "None",
  };
}

/**
 * Category D — all deterministic. D1 is the subscore base; D2–D9 are penalties.
 * D8 (tense) and D10 (spelling) need NLP/a dictionary and are surfaced as info
 * rather than risk false deductions in the live engine.
 */
export function scoreLanguage(sections: ResumeSections): CheckResult[] {
  return [
    actionVerbs(sections),
    weakOpeners(sections),
    verbDiversity(sections),
    cliches(sections),
    aiTells(sections),
    bulletLength(sections),
    bulletCountPerRole(sections),
    {
      id: "D8",
      label: "Tense consistency",
      kind: "info",
      score: 100,
      weight: 0,
      penalty: 0,
      fixes: [],
      detail: "Not auto-checked (needs NLP)",
    },
    noFirstPerson(sections),
    {
      id: "D10",
      label: "Spelling/grammar",
      kind: "info",
      score: 100,
      weight: 0,
      penalty: 0,
      fixes: [],
      detail: "Not auto-checked (no offline spellchecker)",
    },
  ];
}
