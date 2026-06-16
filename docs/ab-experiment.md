# A/B prompt experiment — base prompt vs structured template prompt

Two prompting styles on the same kind of task (a filter + match-prediction feature on the
FIFA stack), so we can compare **# of correction turns, output tokens, total `/cost`, and
whether acceptance criteria were met without follow-ups** (see
[`cost-analysis.md`](./cost-analysis.md) — base arm in §2d, template arm in §2e).

Both arms run on the existing Next.js 16 / React 19 / Tailwind 4 / TS-strict stack and reuse
the `app/lib/fifa/*` data layer and the `/matches` components.

- **`base-prompt`** (arm A → `/overview-base`, Task 4) — the **actual free-form prompt** that
  was typed to build the `/overview-base` page: filter matches + run a prediction. No stack,
  conventions, reuse list, or acceptance criteria are spelled out — the agent must infer them.
- **`template-prompt`** (arm B → `/dashboard`) — the structured
  Role/Context/Constraints/Acceptance/Format prompt derived from
  [`feature-prompt-template.md`](./feature-prompt-template.md), driving the richer advanced
  dashboard (the base feature **plus** a sortable team-stats leaderboard and a status filter).

> The two arms target overlapping-but-not-identical scopes (the template arm is a deliberate
> superset), so the comparison is about **prompting style → cost / turns / quality**, not a
> line-for-line feature rebuild.

---

## `base-prompt` (free-form — arm A, `/overview-base`, Task 4)

The actual prompt typed to build `/overview-base`, recorded verbatim:

> let's add new page overview-base where we would add a possibility to filter by match, by nation
> or by date of match, also let's add posibility to do a match prediction

What this free-form prompt leaves the agent to **infer** (and therefore spend turns on):

- the stack, package manager, and where routes/components live (`app/app/`, `@/*` alias);
- which data layer + components already exist and should be **reused** (`lib/fifa/*`, `MatchCard`,
  `MatchStats`) vs. re-built from scratch;
- the data source and the no-API-key fallback (sample data + demo banner);
- what "done" means — no acceptance criteria, no lint/type/build gate, no discoverability/link
  requirement, no strict-TS / no-`any` constraint.

The agent recovered most of this by reading `AGENTS.md` and the existing code, but each inferred
decision is a research turn or a potential wrong guess — the hidden cost the structured
`template-prompt` below front-loads. Compare the two on correction turns and `/cost`
(base arm in [`cost-analysis.md`](./cost-analysis.md) §2d, template arm in §2e).

---

## `template-prompt` (structured)

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
>   (`buildForm` → `Map<number, TeamForm>` with `played/wins/draws/losses/goalsFor/goalsAgainst`,
>   `predictMatch`).
> - **Reuse — UI:** `app/app/matches/_components/MatchCard.tsx`, `MatchStats.tsx`, and
>   `app/app/overview-base/_components/MatchPredictor.tsx`.
> - **Feature to build:** Add a `/dashboard` page — an *advanced* World Cup control room for
>   fans and analysts that goes beyond `/overview-base`. Reusing the server-fetched match list,
>   it lets the user (a) **forecast** any fixture with the match predictor; (b) read a
>   **team-stats leaderboard** — Played, W/D/L, goals for/against, goal difference and points per
>   nation (Pts = 3·W + D), derived via `buildForm`, with **clickable column headers to re-sort**;
>   and (c) **filter** the match grid by free-text search (team / stadium / match #), nation,
>   match day, and **match status**, with a live "showing X of Y" count, a Clear button, and
>   summary tiles that recompute against the filtered set. Link to it from the home page.
>
> ### 3. Обмеження / Constraints
> - Do **not** bump or swap core deps (Next, React, TS, Tailwind) or migrate config formats.
> - Do **not** edit generated output (`.next/`, `next-env.d.ts`, `node_modules/`, lockfile).
> - No `any`; keep `strict` clean — no new type errors.
> - Keep secrets **server-side**: never import `lib/fifa/client.ts` (or anything reading
>   `process.env`) from a client component.
> - **Reuse** the existing data layer and components; do not duplicate `MatchCard`, `MatchStats`,
>   `MatchPredictor`, or the `buildForm`/format helpers. Add a dependency only with explicit
>   justification.
> - This Next.js version has breaking changes vs. older docs — verify any Next API against
>   `node_modules/next/dist/docs/` before using it.
> - The leaderboard must reflect the **full** dataset (filters change only the match grid, not the
>   standings). Keep SSR deterministic (no hydration drift): fixed locale/UTC formatting only.
>
> ### 4. Acceptance criteria
> Numbered and testable. The feature is **done** only when every item is true.
> 1. `/dashboard` renders three sections from one server-fetched dataset: a **match predictor**, a
>    **team-stats leaderboard**, and a **filterable match grid**.
> 2. The leaderboard lists every nation with **Played / W / D / L / GF / GA / GD / Pts** (Pts =
>    3·W + D, GD = GF − GA), computed via `buildForm`, default-sorted by points then goal
>    difference; clicking a column header re-sorts by that column. It always reflects the **full**
>    dataset (filters do not change it).
> 3. Four combinable filters — text search, nation, match day, **status** — drive the grid (reusing
>    `MatchCard`); a live "showing X of Y" count, a **Clear** button, and `MatchStats` tiles
>    recompute against the filtered set; the empty-filter state is handled.
> 4. The predictor reuses `MatchPredictor` (defaults to two teams, forbids picking the same team
>    twice, labelled a demo model).
> 5. A `loading.tsx` skeleton is handled; the demo-data banner shows when `source === "sample"`;
>    the home page links to `/dashboard`.
> 6. **(standing)** TypeScript-strict with no `any`; follows repo conventions; `npm run lint` and
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

## Conclusion

A **templated / structured prompt lets us do the groundwork up front** and specify in detail what
the agent has to do. Because the template is a fixed checklist (Role, Context, Constraints,
Acceptance, Format), we **don't forget any important part** of the resulting prompt — the reuse
list, the guardrails, the "definition of done" are all forced into the prompt instead of left to
chance.

That groundwork is itself a **cheap, reviewable artifact**: we can read, validate, and improve the
prompt *before* spending a single token on implementation. Fixing a missing requirement in the
prompt costs a sentence; fixing it after the agent has built the wrong thing costs a rebuild.

The payoff shows up downstream. A well-specified prompt produces a **more accurate implementation on
the first pass**, which means **fewer cycles** to fix bugs, re-align scope, and polish. The extra
minutes spent preparing the prompt convert into **10×+ savings of time** on finalizing the
implementation — exactly what this experiment saw: the structured arm shipped a *larger* feature
(`/dashboard` — leaderboard + status filter on top of the base feature) with **zero correction
turns**, while the free-form `base-prompt` arm left the same decisions to be inferred turn by turn
(see the cost diffs: base arm in [`cost-analysis.md`](./cost-analysis.md) §2d, template arm in §2e).

**In short:** invest a little in the prompt to save a lot in the build. Front-loaded specification
is not overhead — it is the cheapest place in the whole loop to catch a mistake.
