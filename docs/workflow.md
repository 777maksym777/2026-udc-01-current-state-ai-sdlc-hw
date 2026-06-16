# Workflow — building a feature through Plan → Agent modes

Exercise: implement one small feature while driving the agent through two modes —
**Plan** (agree on an approach before any code) then **Agent** (execute the agreed
plan) — then review, run, and verify.

**Feature:** a FIFA World Cup matches dashboard at `/matches`, powered by the
BALLDONTLIE FIFA OpenAPI, on the existing Next.js 16 / React 19 / Tailwind 4 / TS-strict stack.

Feature scratchpad: [`feature-fifa-dashboard.md`](./feature-fifa-dashboard.md).

---

## 1. Acceptance criteria (written before any code)

1. Visiting `/matches` renders a FIFA World Cup matches dashboard; the home page links to it.
2. Data is fetched **server-side** from `…/fifa/worldcup/v1/matches?seasons[]=2026` using the API
   key from `BALLDONTLIE_API_KEY` (never exposed to the client). If the key is missing or the
   request fails, the page renders bundled **sample** matches with a visible demo banner.
3. Each match card shows: home vs away (name + abbreviation + flag emoji), scoreline when
   in-progress/completed, a status badge, localized kickoff date/time, and stage/group + stadium·city.
4. A header shows the active season + aggregate stats (total / live / completed / upcoming);
   matches are sorted by kickoff ascending; a `loading.tsx` skeleton shows while data streams.
5. TypeScript-strict (no `any`), follows repo conventions, and `npm run lint` + `npm run build` pass.

---

## 2. Plan mode — what we did

Goal: agree on the approach **before** writing code.

1. **Researched the API first (read-only).** Fetched the OpenAPI spec and extracted the matches
   endpoint, auth scheme, pagination model, and the `FIFAMatch` / `FIFATeam` shapes — so the plan
   was grounded in real fields, not guesses.
2. **Explored the codebase.** Confirmed the create-next-app starter (App Router under `app/app/`,
   Tailwind 4, TS strict) and read `app/AGENTS.md` for conventions (Server Components by default,
   `@/*` alias, no `any`) and guardrails (don't touch generated output; don't bump core deps).
3. **Surfaced the real decisions** with two questions rather than assuming:
   - whether a BALLDONTLIE API key was available, and
   - where the dashboard should live.
4. **Wrote a concrete plan**: typed server-side client + Server Component page, file-by-file, with
   a verification section — then submitted it for approval.

**Design chosen:** a thin typed data layer (`app/lib/fifa/*`) + a Server-Component route
(`app/app/matches/`) with presentational components. No new dependencies.

---

## 3. What we adjusted after reviewing the plan

The plan review (the two questions) changed the design before any code was written:

| Question | Decision | Effect on the plan |
| --- | --- | --- |
| API key available? | **No → bundle a sample-data fallback** (instead of a key-required build or a bare "set the key" notice) | Added `lib/fifa/sample-data.ts`, a `source: "live" \| "sample"` return type on the client, and a "demo data" banner. The feature is now verifiable in the browser **without** a key. |
| Where should it live? | **New `/matches` route** (instead of replacing the home page) | Kept the starter landing page; the home page only gains a link to `/matches` rather than being rewritten. |

Net: criterion #2 was sharpened from "show a config notice" to "graceful **dual-source** rendering
(live or sample) with a visible banner."

---

## 4. Agent mode — what we did

Executed the approved plan:

- **Data layer** — `app/lib/fifa/types.ts` (spec-mirroring types), `sample-data.ts` (6 fixtures),
  `client.ts` (`getWorldCupMatches()` — server-only, reads `BALLDONTLIE_API_KEY`, fetches with a
  5-min revalidate, falls back to sample data on missing key / non-OK / throw, sorts by kickoff),
  `format.ts` (`formatKickoff`, `flagEmoji`, `scoreline`).
- **Route** — `app/app/matches/page.tsx` (async Server Component: banner + stats + card grid +
  empty state), `loading.tsx` (skeleton), and `_components/MatchCard.tsx` + `MatchStats.tsx`.
- **Wiring** — linked `/matches` from `app/app/page.tsx`; added `app/.env.example`.

Conventions honoured: App Router, Server Components (no client JS needed), `@/lib/fifa/*` imports,
Tailwind utilities, strict TS with no `any`. Guardrails honoured: no edits to generated output, no
dependency bumps.

---

## 5. Diff review + run + browser verification

- **Self-review of the diff:** new `app/lib/fifa/*` and `app/app/matches/*`; the only edit to
  existing code is the home page swapping the "Deploy Now" button for the `/matches` link (`Image`
  still used by the logo). No `any`, no stray client directives, secret key stays server-side.
- **Gates:**
  - `npm run lint` → clean
  - `npx tsc --noEmit` → clean
  - `npm run build` → success; `/` and `/matches` prerendered
- **Browser (`npm run dev`, http://localhost:3000):**
  - `/matches` → 200; renders the "FIFA World Cup 2026" header, the amber **demo-data banner**
    referencing `BALLDONTLIE_API_KEY`, the stats tiles, and all six sample matches — with flags,
    scorelines, status badges (Full time / live `67'` / Upcoming), kickoff times, and stadiums.
  - `/` → links to `/matches` via the "View World Cup Matches →" button.

### To run it yourself

```bash
cd app
npm install      # first time only
npm run dev      # http://localhost:3000/matches
# optional live data:
cp .env.example .env.local   # then set BALLDONTLIE_API_KEY=... and reload
```

---

## 6. Result vs acceptance criteria

| # | Criterion | Status |
| --- | --- | --- |
| 1 | `/matches` dashboard + home link | ✅ |
| 2 | Server-side fetch, key server-only, sample fallback + banner | ✅ |
| 3 | Card content (teams, score, status, kickoff, stage/group, stadium) | ✅ |
| 4 | Season + stats header, sorted by kickoff, loading skeleton | ✅ |
| 5 | Strict TS, conventions, lint + build pass | ✅ |
