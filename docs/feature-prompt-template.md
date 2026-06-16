# Structured feature-creation prompt (Role + Context + Constraints + Acceptance + Format)

A reusable, structured prompt for building a new feature in this repo. It is the
**structured-prompt** counterpart to a free-form "base prompt" — same task, but the
role, context, constraints, acceptance criteria, and output format are made explicit
so the agent plans correctly the first time and needs fewer correction turns.

## How to use

Copy the **prompt template** below and fill the `{{PLACEHOLDERS}}`. Sections 1, 3, and 5
(Role / Constraints / Format) are mostly **constant** for this repo — leave them as-is.
You normally only edit **§2 Context → "Feature to build"** and **§4 Acceptance criteria**.

A worked example (the `/overview-base` feature) is filled in at the bottom.

---

## Prompt template (copy from here)

> ### 1. Роль / Role
> You are a senior full-stack engineer working inside an existing Next.js 16 / React 19 /
> TypeScript-strict repository. You **plan before you code**, follow the repo's existing
> conventions, reuse the existing data layer and components, and add dependencies only with
> explicit justification. You verify your own work with the project's lint/type/build gates.
>
> ### 2. Контекст / Context
> - **Stack:** Next.js 16 (App Router), React 19, TypeScript `^5` (`strict`), Tailwind CSS v4,
>   ESLint flat config. Package manager **npm**. Node 20. Run all commands from `app/`.
> - **Layout:** routes under `app/app/`; internal imports use the `@/*` alias (mapped to the app
>   root). Components `PascalCase`; route files use Next.js special-file names (`page.tsx`,
>   `layout.tsx`, `loading.tsx`). Co-locate route-only UI under `_components/`.
> - **Conventions & guardrails:** read `app/AGENTS.md`. Server Components by default; add
>   `"use client"` only when interactivity is required.
> - **Reuse — data layer (`app/lib/fifa/`):** `client.ts` (`getWorldCupMatches()` — server-only,
>   reads `BALLDONTLIE_API_KEY`, 5-min revalidate, falls back to bundled sample data with a
>   `source: "live" | "sample"` flag), `types.ts`, `format.ts` (`formatKickoff`, `flagEmoji`,
>   `scoreline`, `formatMatchDay`, `matchDayKey`), `sample-data.ts`, `predict.ts`
>   (`buildForm`, `predictMatch`).
> - **Reuse — UI:** `app/app/matches/_components/MatchCard.tsx`, `MatchStats.tsx`.
> - **Feature to build:** {{ONE PARAGRAPH — what the feature does, the route it lives at, and who
>   it's for. Name concrete user actions.}}
>
> ### 3. Обмеження / Constraints
> - Do **not** bump or swap core deps (Next, React, TS, Tailwind) or migrate config formats.
> - Do **not** edit generated output (`.next/`, `next-env.d.ts`, `node_modules/`, lockfile).
> - No `any`; keep `strict` clean — no new type errors.
> - Keep secrets **server-side**: never import `lib/fifa/client.ts` (or anything reading
>   `process.env`) from a client component.
> - **Reuse** the existing data layer and components; do not duplicate `MatchCard`/format helpers.
>   Add a dependency only with explicit justification.
> - This Next.js version has breaking changes vs. older docs — verify any Next API against
>   `node_modules/next/dist/docs/` before using it.
> - {{FEATURE-SPECIFIC CONSTRAINTS — perf budget, no new routes, deterministic SSR (no hydration
>   drift), accessibility, design tokens, etc. Delete if none.}}
>
> ### 4. Acceptance criteria
> Numbered and testable. The feature is **done** only when every item is true.
> 1. {{primary user-visible behavior — what renders / what the user can do}}
> 2. {{data & state behavior — fetching, filtering, derived values, defaults}}
> 3. {{edge cases — empty result, loading skeleton, missing/error data, demo-data banner}}
> 4. {{discoverability — which existing page(s) link to this feature}}
> 5. **(standing)** TypeScript-strict with no `any`; follows repo conventions; `npm run lint` and
>    `npx tsc --noEmit` are clean and `npm run build` succeeds.
>
> ### 5. Формат / Format (how to respond and deliver)
> 1. **Plan first.** List files to add/change, key design decisions, and any genuinely ambiguous
>    choices. Ask only when a decision materially changes the outcome; otherwise proceed with a
>    sensible default and state it.
> 2. **Implement** file-by-file, reusing existing helpers and components.
> 3. **Verify** by running the standing gates (lint, `tsc --noEmit`, build) — and a browser check
>    if the feature is visual — then report the actual results.
> 4. **Summarize** with a result-vs-acceptance-criteria table (✅/❌ per item) and a list of files
>    added/changed.
> - Keep prose tight; reference code as `path:line`. Match the surrounding code's style.

---

## Worked example — filling §2 "Feature to build" and §4 for `/overview-base`

**§2 Feature to build:**
> Add an `/overview-base` page for fans exploring the tournament. It reuses the server-fetched
> match list and lets the user (a) filter the matches by free-text search (team / stadium /
> match number), by nation, and by match date; and (b) run a **match prediction**: pick a home
> and away team and see win/draw/win probabilities plus an expected scoreline, derived from the
> goals in completed matches. Link to it from the home page and the `/matches` header.

**§4 Acceptance criteria:**
> 1. `/overview-base` renders the match list with three working filters — text search, nation
>    dropdown, date dropdown — that combine, plus a live "showing X of Y" count and a clear button.
> 2. Filtered results reuse `MatchCard`; `MatchStats` recomputes against the filtered set.
> 3. The predictor defaults to two teams, updates live, forbids picking the same team twice, and
>    labels itself a demo model; teams with no completed matches fall back to a league baseline.
> 4. Empty-filter state and a `loading.tsx` skeleton are handled; the demo-data banner shows when
>    `source === "sample"`.
> 5. Home and `/matches` link to `/overview-base`.
> 6. **(standing)** strict TS, conventions followed, lint + `tsc` + build all pass.

---

## Why structure helps (for the cost/quality comparison)

A free-form **base prompt** ("add a page to filter matches and predict results") forces the agent
to *infer* the stack, where code lives, what to reuse, and when it's done — inference that surfaces
as extra research turns, wrong guesses, and rework, each of which re-sends context and emits output
(the real cost drivers — see [`cost-analysis.md`](./cost-analysis.md) §2c). A **structured prompt**
front-loads those answers, so the agent plans correctly on the first pass. Compare the two runs on:
**# of correction turns, output tokens, total `/cost`, and whether acceptance criteria were met
without follow-ups.**
