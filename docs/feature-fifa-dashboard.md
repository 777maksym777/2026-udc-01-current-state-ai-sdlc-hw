# Feature scratchpad — FIFA World Cup matches dashboard

> Working notes we "played with" while shaping the feature. The polished process
> write-up lives in [`workflow.md`](./workflow.md).

## Idea

A small dashboard that lists FIFA World Cup matches, powered by the BALLDONTLIE
FIFA OpenAPI (`https://www.balldontlie.io/openapi/fifa.yml`), built on the existing
Next.js 16 / React 19 / Tailwind 4 / TS-strict stack.

## Acceptance criteria

1. Visiting `/matches` renders a FIFA World Cup matches dashboard; the home page links to it.
2. Data is fetched **server-side** from `…/fifa/worldcup/v1/matches?seasons[]=2026` using the API
   key from `BALLDONTLIE_API_KEY` (never exposed to the client). If the key is missing or the
   request fails, the page renders bundled **sample** matches with a visible demo banner.
3. Each match card shows: home vs away (name + abbreviation + flag emoji), scoreline when
   in-progress/completed, a status badge, localized kickoff date/time, and stage/group + stadium·city.
4. A header shows the active season + aggregate stats (total / live / completed / upcoming);
   matches are sorted by kickoff ascending; a loading skeleton shows while data streams.
5. TypeScript-strict (no `any`), follows repo conventions, and `npm run lint` + `npm run build` pass.

## Endpoint notes (from the OpenAPI spec)

- **Base URL:** `https://api.balldontlie.io`
- **Auth:** `Authorization: <API key>` header
- **Matches:** `GET /fifa/worldcup/v1/matches`
  - optional query: `seasons[]`, `team_ids[]`, `match_ids[]`, `per_page` (≤100), `cursor`
  - cursor pagination; we fetch a single `per_page=100` page (enough for a season overview)
- **Teams:** `GET /fifa/worldcup/v1/teams` (optional `seasons[]`) — not needed; team objects are
  embedded in each match.
- Other endpoints available for later: `group_standings`, `players`, `rosters`, `match_events`,
  `match_lineups`, `odds`, …

## Data shape used (subset of `FIFAMatch`)

```jsonc
{
  "id": 1,
  "datetime": "2026-06-10T20:00:00Z",   // ISO 8601 UTC
  "status": "scheduled|in_progress|completed|postponed|cancelled",
  "clock_display": "47:15",
  "stage": { "name": "Group Stage" },
  "group": { "name": "A" },              // nullable (knockouts)
  "stadium": { "name": "...", "city": "...", "country": "US" },
  "home_team": { "name": "United States", "abbreviation": "USA", "country_code": "US" },
  "away_team": { "name": "Mexico", "abbreviation": "MEX", "country_code": "MX" },
  "home_score": 2, "away_score": 1,
  "home_score_penalties": null, "away_score_penalties": null
}
```

## Open questions → resolved

- **No API key on hand?** → ship a bundled sample dataset + "demo data" banner so the page is
  verifiable without a key (live fetch kicks in once `BALLDONTLIE_API_KEY` is set).
- **Where does it live?** → new `/matches` route; keep the starter home page and add a link.

## Future ideas (out of scope)

- Season selector (the API takes `seasons[]`).
- Group standings tab (`/group_standings`).
- Filter by team (`team_ids[]`) and follow cursor pagination for full schedules.
- Auto-refresh live matches (poll / revalidate shorter while `in_progress`).
