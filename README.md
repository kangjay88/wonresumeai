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
- [x] **Design system / color palette** — intentional slate + coral palette
  (`#2D3142 #4F5D75 #BFC0C0 #FFFFFF #EF8354`) driven entirely from the
  `@theme` token block in `app/globals.css`; reusable UI primitives in
  `components/ui/` (`Button`, `Input`/`Textarea`/`Select`, `Card`, `Badge` +
  `buttonClass` for styled `<Link>`s) replace the ~40 copy-pasted class
  strings, so buttons/fields/surfaces are now restyleable from one place too.
- [x] **Dashboard redesign** — interactive pipeline overview (each stage a
  stat cell that doubles as the list filter), applications list beside a
  recent-activity feed (merged application-created + document-save events),
  and quick "new application" entry in the header and empty state.
- [x] **Job application status** — List/Board view toggle on the dashboard;
  the Board is a drag-and-drop kanban (native HTML5 DnD, no dependency) with a
  column per stage. Dropping a card persists the move via
  `updateApplicationStatus` with optimistic local state (reverts on failure)
  and live-updating pipeline counts.
- [x] **Multi-step application flow** — application page is a guided stepper
  (Score & JD → Tailor resume → Cover letter) with a clickable progress header,
  per-step completion checks, and Back/Next (`application-wizard.tsx`).
- [x] **Loading & transitions** — route-level `loading.tsx` skeletons
  (dashboard, application, resume builder), `Skeleton`/`CardSkeleton` primitives,
  in-panel skeletons during AI generation, and a fade-in on step changes.

**Scoring / quality (competitive gaps):**
- [x] Imported-PDF parse validation (`lib/pdf/validate.ts`): on upload, flags
  likely-scanned PDFs (low text-per-page) and multi-column layouts (empty
  central gutter with text on both sides) as warnings surfaced on the
  onboarding confirm step, so the user reviews before saving. Warnings, not
  hard blocks — the single-column-with-dates false-positive case is guarded.
- [x] Apply the null-tolerant `lenientString` schema pattern to the
  `parse-resume` and `extract-jd` schemas — plus a `lenientStringArray`
  companion so a `null` array (or `null`/blank items) degrades to `[]`/clean
  strings instead of throwing (robustness debt noted during Phase 4).

**Feature polish (from `docs/PLAN.md` §6 + analysis):**
- [x] Version diff view — side-by-side compare of two saved resume versions
  (`version-diff.tsx`) on the application page: pick a base/compare version,
  LCS line-diff (`lib/diff.ts`, no dependency) of summary, per-role experience
  bullets, and skills, with add/remove/modified highlighting and an "only
  changes" toggle.
- [ ] Career-memory & voice management — edit profile/target roles + manage
  voice samples without re-uploading; surface what tailoring learned from
  `suggestion_edits`.
- [x] Persist the AI rubric review — cached on `applications.review` (new
  column, migration `0002`) when `api/ai/review` runs, and re-applied on page
  load so revisiting doesn't re-pay for the same Sonnet pass. "Re-run AI
  review" overwrites the cache.
- [ ] Prompt tuning from real accept/reject data.
