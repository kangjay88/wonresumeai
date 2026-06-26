// Calibration harness for the scoring engine.
//   npx tsx scripts/calibrate.ts
//
// Scores three fixtures and asserts the ordering the spec requires:
//   1. real > weakened            (no JD)
//   2. hand-tailored > real       (both scored against the target JD)
// Tune weights in lib/scoring until this holds before trusting the number.
import { scoreResume } from "@/lib/scoring";
import {
  jdExtractionSchema,
  resumeSectionsSchema,
  type JdExtraction,
  type ResumeSections,
} from "@/lib/types";

const contact = {
  name: "Jay Kang",
  email: "jay@example.com",
  phone: "555-123-4567",
  location: "Toronto, ON",
  linkedin: "linkedin.com/in/jaykang",
  website: "",
};

const education = [
  {
    school: "University of Toronto",
    degree: "BSc",
    field: "Computer Science",
    startDate: "Sep 2015",
    endDate: "Apr 2019",
    details: "",
  },
];

// --- Fixture 1: real resume (solid, quantified, well-formed) ----------------
const real: ResumeSections = resumeSectionsSchema.parse({
  contact,
  summary: "Full-stack software engineer who ships reliable web apps end to end.",
  experience: [
    {
      company: "Acme",
      title: "Software Engineer",
      location: "Remote",
      startDate: "Jan 2022",
      endDate: "Present",
      bullets: [
        "Led migration of the billing service to TypeScript, cutting runtime errors 40%.",
        "Built a React dashboard used by 1,200+ internal users for revenue reporting.",
        "Reduced API p95 latency 32% by adding Redis caching to hot endpoints.",
        "Mentored 3 junior engineers through structured code review and pairing.",
      ],
    },
    {
      company: "Startup Inc",
      title: "Software Developer",
      location: "Toronto, ON",
      startDate: "Jun 2019",
      endDate: "Dec 2021",
      bullets: [
        "Developed REST APIs in Node.js and PostgreSQL serving 500 requests per second.",
        "Shipped a CI/CD pipeline with GitHub Actions, cutting deploy time from 30 to 5 minutes.",
        "Designed an onboarding flow that improved activation 18%.",
      ],
    },
  ],
  education,
  skills: ["TypeScript", "React", "Node.js", "PostgreSQL", "AWS", "Redis", "Docker", "CI/CD"],
  projects: [],
});

// --- Fixture 2: weakened (numbers stripped, weak openers, clichés) ----------
const weakened: ResumeSections = resumeSectionsSchema.parse({
  contact,
  summary: "Results-driven team player passionate about technology and synergy.",
  experience: [
    {
      company: "Acme",
      title: "Software Engineer",
      location: "Remote",
      startDate: "Jan 2022",
      endDate: "Present",
      bullets: [
        "Responsible for maintaining the billing service and fixing bugs.",
        "Worked on a dashboard for internal users.",
        "Helped improve API performance over time.",
        "I utilized various tools to support the team's goals.",
      ],
    },
    {
      company: "Startup Inc",
      title: "Software Developer",
      location: "Toronto, ON",
      startDate: "2019", // malformed date (dings A3)
      endDate: "Dec 2021",
      bullets: [
        "Assisted with building APIs.",
        "Duties included deploying code to production.",
      ],
    },
  ],
  education,
  skills: ["TypeScript", "React", "Node.js", "PostgreSQL", "AWS", "Redis", "Docker", "CI/CD"],
  projects: [],
});

// --- Target JD --------------------------------------------------------------
const jd: JdExtraction = jdExtractionSchema.parse({
  required_skills: ["React", "TypeScript", "Node.js", "PostgreSQL", "AWS", "REST"],
  preferred_skills: ["GraphQL", "Kubernetes", "Docker"],
  title_variants: ["Senior Software Engineer", "Senior Full Stack Engineer"],
  seniority_signals: ["senior", "ownership", "mentorship"],
  domain_terms: ["billing", "payments", "dashboards"],
});

// --- Fixture 3: hand-tailored to the JD -------------------------------------
const handTailored: ResumeSections = resumeSectionsSchema.parse({
  contact,
  summary:
    "Senior Software Engineer building full-stack products on React, TypeScript, and Amazon Web Services (AWS).",
  experience: [
    {
      company: "Acme",
      title: "Senior Software Engineer",
      location: "Remote",
      startDate: "Jan 2022",
      endDate: "Present",
      bullets: [
        "Architected a React + TypeScript billing dashboard used by 1,200+ users, cutting reporting time 40%.",
        "Owned the Node.js and PostgreSQL REST API, scaling it to 500 requests per second.",
        "Led migration to Kubernetes on AWS, reducing deploy time from 30 to 5 minutes.",
        "Mentored 3 engineers and introduced a GraphQL layer adopted across 4 teams.",
      ],
    },
    {
      company: "Startup Inc",
      title: "Software Developer",
      location: "Toronto, ON",
      startDate: "Jun 2019",
      endDate: "Dec 2021",
      bullets: [
        "Built continuous integration (CI/CD) pipelines with GitHub Actions across 6 services.",
        "Designed an onboarding flow that improved activation 18%.",
      ],
    },
  ],
  education,
  skills: ["TypeScript", "React", "Node.js", "PostgreSQL", "AWS", "GraphQL", "Kubernetes", "Docker", "REST"],
  projects: [],
});

function line(label: string, report: ReturnType<typeof scoreResume>) {
  const cats = report.categories
    .map((c) => `${c.key[0].toUpperCase()}:${c.score}`)
    .join("  ");
  console.log(`${label.padEnd(16)} total=${String(report.total).padStart(3)}   ${cats}`);
}

const realNoJD = scoreResume(real);
const weakNoJD = scoreResume(weakened);
const realJD = scoreResume(real, jd);
const tailoredJD = scoreResume(handTailored, jd);

console.log("\n=== No JD ===");
line("real", realNoJD);
line("weakened", weakNoJD);
console.log("\n=== Against target JD ===");
line("real", realJD);
line("hand-tailored", tailoredJD);

console.log("\n=== Top fixes (weakened, no JD) ===");
for (const c of weakNoJD.categories) {
  for (const f of c.topFixes) console.log(`  [${f.checkId}] ${f.message}`);
}

const check1 = realNoJD.total > weakNoJD.total;
const check2 = tailoredJD.total > realJD.total;
console.log("\n=== Assertions ===");
console.log(`  real > weakened (no JD):        ${check1 ? "PASS" : "FAIL"} (${realNoJD.total} vs ${weakNoJD.total})`);
console.log(`  hand-tailored > real (with JD): ${check2 ? "PASS" : "FAIL"} (${tailoredJD.total} vs ${realJD.total})`);

if (!check1 || !check2) {
  console.error("\nCalibration FAILED — adjust weights.");
  process.exit(1);
}
console.log("\nCalibration PASSED.");
