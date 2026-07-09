import Link from "next/link";

import { buttonClass, Card, cn } from "@/components/ui";

export const metadata = {
  title: "WonResume Ai — ATS-scored, voice-preserving resume tailoring",
  description:
    "Paste a job description and get an ATS-scored, voice-preserving resume and cover letter in minutes. Track every application from saved to offer.",
};

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Nav />
      <main className="flex-1">
        <Hero />
        <Features />
        <HowItWorks />
        <Pricing />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}

// ---------------------------------------------------------------------------

function Wordmark() {
  return (
    <span className="flex items-center gap-2 font-semibold">
      <span className="grid h-6 w-6 place-items-center rounded-md bg-brand-600 text-xs font-bold text-canvas">
        W
      </span>
      WonResume Ai
    </span>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-10 border-b border-line/60 bg-canvas/80 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="text-ink">
          <Wordmark />
        </Link>
        <div className="hidden items-center gap-8 text-sm text-muted sm:flex">
          <a href="#features" className="hover:text-ink">
            Features
          </a>
          <a href="#how" className="hover:text-ink">
            How it works
          </a>
          <a href="#pricing" className="hover:text-ink">
            Pricing
          </a>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="text-sm font-medium text-muted hover:text-ink"
          >
            Log in
          </Link>
          <Link href="/login" className={buttonClass({ size: "sm" })}>
            Get started
          </Link>
        </div>
      </nav>
    </header>
  );
}

// ---------------------------------------------------------------------------

function Hero() {
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:py-28">
      <div className="space-y-6">
        <span className="reveal inline-flex items-center rounded-full border border-line bg-card px-3 py-1 text-xs font-medium text-muted">
          AI resume tailoring · built on Claude
        </span>
        <h1 className="reveal reveal-2 text-4xl font-semibold tracking-tight sm:text-5xl">
          Tailor every resume to the job — and{" "}
          <span className="text-brand-400">land the interview.</span>
        </h1>
        <p className="reveal reveal-3 max-w-xl text-lg text-muted">
          Paste a job description and get an ATS-scored, voice-preserving resume
          and cover letter in minutes. No fabricated metrics, no generic AI
          voice — just your experience, sharpened for the role.
        </p>
        <div className="reveal reveal-4 flex flex-wrap items-center gap-3">
          <Link href="/login" className={buttonClass()}>
            Get started free
          </Link>
          <a href="#how" className={buttonClass({ variant: "secondary" })}>
            See how it works
          </a>
        </div>
        <p className="reveal reveal-5 text-xs text-faint">
          Free to start · No credit card required
        </p>
      </div>

      <HeroPreview />
    </section>
  );
}

/** Lightweight faux score panel — mirrors the real product without an asset. */
function HeroPreview() {
  const bars = [
    { label: "ATS parseability", score: 92 },
    { label: "Keyword match", score: 88 },
    { label: "Impact", score: 79 },
    { label: "Language", score: 90 },
  ];
  return (
    <Card className="reveal reveal-3 space-y-4 p-6 shadow-2xl shadow-black/40">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink">
          Resume score
        </h2>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-brand-400">86</span>
          <span className="text-sm text-faint">/100</span>
        </div>
      </div>
      <div className="space-y-3">
        {bars.map((b) => (
          <div key={b.label} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">{b.label}</span>
              <span className="tabular-nums text-ink">{b.score}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-brand-500"
                style={{ width: `${b.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-line bg-white/[0.02] p-3 text-xs text-muted">
        <span className="font-medium text-ink">3 fixes suggested</span> · add
        “Kubernetes” to skills, quantify the migration bullet, tighten the summary.
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------

const FEATURES = [
  {
    title: "Calibrated ATS score",
    body: "A deterministic 0–100 score across ATS parseability, keyword match, impact, and language — with concrete fixes, not vibes.",
    icon: "gauge",
  },
  {
    title: "Job-description matching",
    body: "Extracts required skills, titles, and domain terms from any JD and scores your resume against exactly what the role asks for.",
    icon: "target",
  },
  {
    title: "Voice-preserving AI",
    body: "Rewrites weak bullets in your own voice, mirroring how you actually write — and never invents metrics you didn't earn.",
    icon: "spark",
  },
  {
    title: "Cover letters",
    body: "Generate a resume-backed cover letter in your voice, paragraph by paragraph, with accept / edit / reject on each one.",
    icon: "doc",
  },
  {
    title: "Application pipeline",
    body: "Track every application on a kanban board from saved to offer, with a pipeline overview and recent activity at a glance.",
    icon: "board",
  },
  {
    title: "Versions & diff",
    body: "Every tailored resume is saved and re-exportable, with a side-by-side diff of exactly what changed between versions.",
    icon: "layers",
  },
] as const;

function Features() {
  return (
    <section id="features" className="border-t border-line/60 bg-white/[0.015]">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="reveal max-w-2xl space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-400">
            Features
          </p>
          <h2 className="text-3xl font-semibold tracking-tight">
            Everything you need to tailor with confidence
          </h2>
          <p className="text-muted">
            Deterministic scoring where it should be deterministic, and AI only
            where judgment helps — always in your voice.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Card
              key={f.title}
              className="reveal space-y-3 p-5"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <FeatureIcon name={f.icon} />
              <h3 className="font-semibold">{f.title}</h3>
              <p className="text-sm text-muted">{f.body}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------

const STEPS = [
  {
    n: 1,
    title: "Upload your resume",
    body: "We read your PDF into a structured, editable profile — once. Multi-column and scanned files are flagged so nothing scores dishonestly.",
  },
  {
    n: 2,
    title: "Paste the job description",
    body: "We extract the role's keywords and score your fit instantly, category by category, with the exact fixes that raise it.",
  },
  {
    n: 3,
    title: "Tailor & export",
    body: "Accept voice-preserving suggestions, generate a matching cover letter, and export a clean, ATS-friendly PDF.",
  },
] as const;

function HowItWorks() {
  return (
    <section id="how" className="mx-auto max-w-6xl px-6 py-20">
      <div className="reveal max-w-2xl space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-400">
          How it works
        </p>
        <h2 className="text-3xl font-semibold tracking-tight">
          From raw resume to tailored application in three steps
        </h2>
      </div>
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {STEPS.map((s) => (
          <div
            key={s.n}
            className="reveal space-y-3"
            style={{ animationDelay: `${s.n * 60}ms` }}
          >
            <div className="grid h-9 w-9 place-items-center rounded-full border border-brand-500 bg-brand-500/15 text-sm font-semibold text-brand-300">
              {s.n}
            </div>
            <h3 className="font-semibold">{s.title}</h3>
            <p className="text-sm text-muted">{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------

const PLANS = [
  {
    name: "Free",
    price: "$0",
    cadence: "forever",
    blurb: "For a single active search.",
    features: [
      "3 active applications",
      "Calibrated ATS scoring",
      "1 base resume + PDF export",
      "JD keyword matching",
    ],
    cta: "Get started",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$12",
    cadence: "per month",
    blurb: "For a serious job hunt.",
    features: [
      "Unlimited applications",
      "Voice-preserving AI tailoring",
      "AI cover letters",
      "Version history & diff",
      "Voice-sample management",
    ],
    cta: "Start Pro",
    highlight: true,
  },
  {
    name: "Coach",
    price: "Custom",
    cadence: "contact us",
    blurb: "For career coaches & teams.",
    features: [
      "Everything in Pro",
      "Multiple client seats",
      "Shared templates",
      "Priority support",
    ],
    cta: "Contact us",
    highlight: false,
  },
] as const;

function Pricing() {
  return (
    <section id="pricing" className="border-t border-line/60 bg-white/[0.015]">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="reveal max-w-2xl space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-400">
            Pricing
          </p>
          <h2 className="text-3xl font-semibold tracking-tight">
            Choose the plan that fits your search
          </h2>
          <p className="text-muted">
            Start free. Upgrade when you&apos;re applying in volume. Cancel
            anytime.
          </p>
        </div>

        <div className="mt-10 grid items-start gap-4 lg:grid-cols-3">
          {PLANS.map((plan, i) => (
            <Card
              key={plan.name}
              style={{ animationDelay: `${i * 70}ms` }}
              className={cn(
                "reveal flex flex-col gap-5 p-6",
                plan.highlight && "border-brand-500 ring-1 ring-brand-500/40",
              )}
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{plan.name}</h3>
                  {plan.highlight ? (
                    <span className="rounded-full bg-brand-500/15 px-2 py-0.5 text-xs font-medium text-brand-300">
                      Most popular
                    </span>
                  ) : null}
                </div>
                <p className="text-sm text-muted">{plan.blurb}</p>
              </div>

              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-bold">{plan.price}</span>
                <span className="text-sm text-faint">{plan.cadence}</span>
              </div>

              <ul className="flex-1 space-y-2 text-sm">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-2 text-muted">
                    <CheckIcon />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/login"
                className={buttonClass({
                  variant: plan.highlight ? "primary" : "secondary",
                  fullWidth: true,
                })}
              >
                {plan.cta}
              </Link>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------

function FinalCta() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <Card className="reveal space-y-5 p-10 text-center">
        <h2 className="text-3xl font-semibold tracking-tight">
          Stop sending the same resume everywhere.
        </h2>
        <p className="mx-auto max-w-xl text-muted">
          Tailor it to each role, keep your voice, and know your score before you
          hit apply.
        </p>
        <div className="flex justify-center">
          <Link href="/login" className={buttonClass()}>
            Get started free
          </Link>
        </div>
      </Card>
    </section>
  );
}

function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-line/60">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-muted sm:flex-row">
        <Wordmark />
        <div className="flex items-center gap-6">
          <a href="#features" className="hover:text-ink">
            Features
          </a>
          <a href="#pricing" className="hover:text-ink">
            Pricing
          </a>
          <Link href="/login" className="hover:text-ink">
            Log in
          </Link>
        </div>
        <span className="text-faint">© {year} WonResume Ai</span>
      </div>
    </footer>
  );
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function FeatureIcon({ name }: { name: string }) {
  const paths: Record<string, React.ReactNode> = {
    gauge: (
      <>
        <path d="M12 13a4 4 0 0 1 4-4" />
        <path d="M4 20a8 8 0 1 1 16 0" />
        <path d="M12 20v-7" />
      </>
    ),
    target: (
      <>
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
      </>
    ),
    spark: (
      <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" />
    ),
    doc: (
      <>
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
        <path d="M14 3v5h5M9 13h6M9 17h6" />
      </>
    ),
    board: (
      <>
        <rect x="3" y="4" width="5" height="16" rx="1" />
        <rect x="10" y="4" width="5" height="11" rx="1" />
        <rect x="17" y="4" width="4" height="7" rx="1" />
      </>
    ),
    layers: (
      <>
        <path d="M12 3l9 5-9 5-9-5 9-5z" />
        <path d="M3 13l9 5 9-5" />
      </>
    ),
  };
  return (
    <span className="grid h-9 w-9 place-items-center rounded-lg border border-line bg-brand-500/10 text-brand-300">
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {paths[name]}
      </svg>
    </span>
  );
}

function CheckIcon() {
  return (
    <svg
      className="mt-0.5 h-4 w-4 shrink-0 text-brand-400"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}
