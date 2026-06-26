# Resume Tailor

Personal AI resume tailoring app. Paste a job description → get an ATS-scored,
voice-preserving tailored resume + cover letter with editable per-bullet
suggestions, versioned per application.

Single user. See [`docs/PLAN.md`](docs/PLAN.md) for the full plan and
[`docs/resume-scoring-spec.md`](docs/resume-scoring-spec.md) for the scoring
criteria.

## Stack

- Next.js 16 (App Router, TypeScript) + Tailwind v4
- Supabase (Postgres + Auth) via `@supabase/ssr`, RLS on every table
- Anthropic API (`@anthropic-ai/sdk`) — Haiku for extraction, Sonnet for tailoring
- Deploy target: Vercel Hobby

> Note: Next 16 renamed the `middleware` file convention to `proxy`. The auth
> session refresh + route gate lives in [`proxy.ts`](proxy.ts).

## Setup

One-time manual steps (the app spends real API money — gate everything):

1. **Supabase project** — create one at supabase.com.
   - Run the migration: paste `supabase/migrations/0001_init.sql` into the SQL
     editor (or `supabase db push` with the CLI). 
   - Auth → Providers → enable Email. For a frictionless single-user setup you
     may disable email confirmation.
   - Create your single user (sign up via the app, or Auth → Users → Add user).
2. **Anthropic** — create an API key at console.anthropic.com and **set a
   monthly spend limit** (e.g. $20).
3. **Env** — copy `.env.example` to `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server only)
   - `ANTHROPIC_API_KEY` (server only)
4. **Regenerate DB types** (optional but recommended once the project exists):
   ```bash
   npx supabase gen types type    script --project-id <ref> > lib/supabase/types.ts
   ```

## Develop

```bash
npm run dev      # http://localhost:3000
npm run build    # production build / typecheck
npm run lint
```

## Deploy (Vercel)

Import the repo, add the four env vars above (mark the service role and
Anthropic keys as server-only), deploy.

## Phase status

Building in phases per `docs/PLAN.md`; each phase ends deployable.

- [x] **Phase 0 — Scaffold**: Next.js + Tailwind, Supabase clients, schema +
  RLS migration, email/password auth, protected layout, proxy session gate.
- [x] **Phase 1 — Career memory**: PDF upload → unpdf text extraction → Haiku
  parse → editable confirmation UI → persist `career_memory` + seed
  `base_resumes` "Master resume" + harvest `voice_samples`.
- [x] **Phase 2 — Resume builder + PDF export**: section editor
  (`components/resume-editor.tsx`, shared with onboarding), live PDF preview via
  `<PDFViewer>` and client-side download — both render the single
  `lib/pdf/resume-document.tsx` template (no layout drift). PDF generated
  client-side, not via a server route.
- [x] **Phase 3 — Scoring engine**: `lib/scoring/` implements the spec's
  deterministic checks (A ATS, B keywords/JD, C impact, D language) as pure
  functions returning subscores + concrete fixes; live score panel in the
  builder (no-JD: A/C/D); `npm run calibrate` ranks real > weakened and
  hand-tailored > real. C2/C3 LLM rubric deferred to Phase 4.
- [x] **Phase 4 — Applications + tailoring**: new-application flow + Haiku JD
  extraction; score-vs-JD (category B live); on-demand AI review (`api/ai/review`)
  for C2/C3 rubric + semantic JD coverage; exact PDF page count feeding A7;
  voice-preserving Sonnet tailoring (`api/ai/tailor`) with accept/edit/reject
  suggestion cards, live score, versioned `documents` saves + `suggestion_edits`
  capture, and per-version PDF re-export.
- [x] **Phase 5 — Cover letters + dashboard**: voice-preserving Sonnet cover
  letters (`api/ai/cover-letter`) from the latest tailored resume → paragraph
  cards → cover-letter PDF + versioned saves; dashboard status pipeline with
  per-status filtering; resume + cover-letter version history with re-export on
  each application.

### Phase 6 — Polish & UX (planned, post-launch)

Deployed and in real use; these are pulled from real usage + the competitive
analysis (vs. Jobscan / Resume Worded / Teal / Rezi).

**UX redesign (next focus — draw from competitor patterns via Mobbin):**
- [ ] **Design system / color palette** — replace the grayscale-default look
  with an intentional palette + typography; centralize tokens (Tailwind theme)
  so the whole app is restyleable from one place.
- [ ] **Dashboard redesign** — stronger applications overview (pipeline at a
  glance, recent activity, quick "new application" entry).
- [ ] **Job application status** — richer status pipeline (board/kanban or
  improved pipeline view) beyond today's filter chips.
- [ ] **Multi-step application flow** — turn the single application-detail page
  into a guided stepper: **1) Extract JD + AI score → 2) Tailor resume →
  3) Create cover letter**, with progress indication and per-step completion.

**Scoring / quality (competitive gaps):**
- [ ] Real spell-check (currently D10 is info-only) — close the table-stakes gap.
- [ ] Imported-PDF parse validation (multi-column / scanned detection) so
  uploaded resumes score honestly, not assumed-clean.
- [ ] Apply the null-tolerant `lenientString` schema pattern to the
  `parse-resume` and `extract-jd` schemas (robustness debt noted during Phase 4).

**Feature polish (from `docs/PLAN.md` §6 + analysis):**
- [ ] Version diff view — side-by-side compare of two saved resume versions.
- [ ] Career-memory & voice management — edit profile/target roles + manage
  voice samples without re-uploading; surface what tailoring learned from
  `suggestion_edits`.
- [ ] Persist the AI rubric review on the document score snapshot (avoid re-paying).
- [ ] Prompt tuning from real accept/reject data.
