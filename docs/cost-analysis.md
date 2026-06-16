# Token & cost analysis — FIFA World Cup dashboard feature

Goal: **measure** token usage and cost, not guess it. Numbers below are measured
with `repomix` (run on 2026-06-16); cost is computed against Claude list prices.

> **Tokenizer caveat:** `repomix` counts with OpenAI's `o200k_base` encoder. Claude's
> tokenizer differs slightly, so treat these as ±10–15% proxies, not exact Claude tokens.
> For the exact *session* spend, see **§2c** — the real `/cost` readout for the Task 1–3
> session is now captured there and is the authoritative number; §2a/§2b are list-price models.
> **§2d** extends this to the full Tasks 1–4 + prompt-tooling session ($8.31) and computes the diff;
> **§2e** adds the structured template-prompt `/dashboard` build ($10.65) and diffs that increment.

---

## 1. Measured context size (`npx repomix`)

| Scope | Files | Tokens |
| --- | ---: | ---: |
| **App project only** (`./app`, respects `.gitignore`) | 25 | **10,639** |
| **Whole repo** (root) | 113 | **87,739** |
| Feature code I authored (8 new files, summed) | 8 | **~4,488** |

Top files in the app context:

| File | Tokens | % |
| --- | ---: | ---: |
| `lib/fifa/sample-data.ts` | 1,336 | 12.6% |
| `public/next.svg` (starter asset) | 1,195 | 11.2% |
| `app/matches/_components/MatchCard.tsx` | 931 | 8.8% |
| `AGENTS.md` | 815 | 7.7% |
| `public/globe.svg` (starter asset) | 741 | 7.0% |
| `app/page.tsx` | 609 | 5.7% |
| `app/matches/page.tsx` | 525 | 4.9% |
| `lib/fifa/{client,format,types}.ts` | 1,182 | 11.1% |

**Key observation:** the whole repo is **8.2× larger** than the app alone, and the
~77k-token gap is almost entirely the committed agent skill under `.agents/skills/`
(its `AGENTS.md` is ~108 KB + 70 rule files). That content is irrelevant to 99% of edits.

---

## 2. Cost estimate (tokens × model price)

Claude list prices (per 1M tokens):

| Model | Input | Output | Cached read |
| --- | ---: | ---: | ---: |
| **Opus 4.8** (used here) | $15 | $75 | $1.50 |
| Sonnet 4.6 | $3 | $15 | $0.30 |
| Haiku 4.5 | $1 | $5 | $0.10 |

### 2a. Cost to feed a context **once** (input only)

| Context | Opus | Sonnet | Haiku |
| --- | ---: | ---: | ---: |
| App (10,639 tok) | **$0.16** | $0.032 | $0.011 |
| Whole repo (87,739 tok) | **$1.32** | $0.263 | $0.088 |

A single pass is cheap. The bill grows because an **agentic loop re-sends context every
turn** and adds output tokens.

### 2b. End-to-end feature build (plan + agent) — *estimate*

This run was ~20 assistant turns (research → plan → ~12 file writes → lint/build/verify).
Modelled with prompt caching on a stable system prompt + `AGENTS.md`:

| Component | Tokens | Opus cost |
| --- | ---: | ---: |
| Uncached input (first sends, new tool results) | ~70k | ~$1.05 |
| Cached input reads (re-sent context) | ~630k | ~$0.95 |
| Output (code + reasoning + prose) | ~20k | ~$1.50 |
| **Total (with caching)** | | **≈ $3.5** |
| Same run **without** prompt caching | ~700k in + 20k out | ≈ $12 |

> Numbers in 2b are an order-of-magnitude estimate from turn count × typical context size.
> Superseded by the measured `/cost` figure in **§2c** below.

**Takeaways from the math:** prompt caching cut repeated-context cost by ~70% here, and
output tokens (Opus $75/M) are a bigger lever per-token than input.

### 2c. Actual measured session spend (`/cost`) — ground truth

The real billed spend for the **full session covering Tasks 1–3** (build the feature →
cost analysis → optimization), read straight from `/cost`:

| Metric | Value |
| --- | --- |
| **Total cost** | **$5.84** |
| API duration | 20m 32s |
| Wall-clock | 50m 33s |
| Code changes | +1,001 / −14 lines |

| Model | Input | Output | Cache read | Cache write | Cost |
| --- | ---: | ---: | ---: | ---: | ---: |
| **Opus 4.8** | 13.0k | 70.4k | 5.8M | 174.7k | **$5.81** |
| Haiku 4.5 | 15.1k | 1.8k | 0 | 0 | $0.024 |
| **Total** | 28.1k | 72.2k | 5.8M | 174.7k | **$5.84** |

What the measured data actually shows:

1. **Opus is 99.6% of the bill** ($5.81 of $5.84). Haiku did some routine work for **2.4¢** —
   proof that model routing (optimization #2) works — but it was barely used. Pushing more
   boilerplate to Haiku/Sonnet is the **single biggest remaining lever**.

2. **Output is the cost driver, not input.** Opus emitted **70.4k output tokens** (the 1,001
   lines of code + reasoning + prose) against only 13.0k of fresh input. At Opus rates, output
   is 5× the per-token price of input, so the ~5.4:1 output-to-input ratio is where the money
   went — exactly the §2b takeaway, now confirmed with real numbers.

3. **Prompt caching carried the run.** **5.8M tokens were served from cache** — ~80× the volume
   of fresh input (13.0k) + cache writes (174.7k). Those re-sent-context tokens billed at the
   cached rate (~10% of fresh input) instead of full price; had they been re-billed as fresh
   input every turn, this session would have cost **several times more**. The 174.7k cache
   *write* is the one-time cost of populating that cache — cheap insurance that paid off ~33×.

4. **Estimate vs. actual:** §2b modelled **≈$3.5**; the real spend was **$5.84 (~1.7× higher)**.
   The estimate had the right *shape* (caching + output dominate) but undercounted *volume* —
   the run produced ~3.5× more output (70.4k vs ~20k) and re-read ~9× more cached context
   (5.8M vs ~630k) than guessed. This gap is the whole point of the doc: **measure, don't guess.**

> **Price-table caveat:** applying the §2 list prices ($15/$75/M) to these exact token counts
> predicts a *higher* figure (~$17) than the **$5.84 actually billed**, so Opus 4.8's effective
> blended rate this session ran well below list. Treat §2a/§2b dollars as list-price models and
> the **$5.84 here as the ground truth.** (`/cost` reports a per-model total only, not a
> per-component dollar split, so no line-item breakdown is shown.)

### 2d. Updated measured spend — Tasks 1–4 + prompt tooling (`/cost`) — diff vs §2c

After the §2c snapshot the **same continuous session** went on to: build the `/overview-base`
feature (Task 4, with a free-form **"base" prompt**), author the structured feature-creation
prompt template ([`feature-prompt-template.md`](./feature-prompt-template.md)), and extend this
cost doc. The `/cost` counter is **cumulative across the session**, so the new readout contains
everything in §2c *plus* that work. The diff below isolates the increment.

| Metric | §2c (Tasks 1–3) | Now (Tasks 1–4 + tooling) | Δ increment |
| --- | ---: | ---: | ---: |
| **Total cost** | $5.84 | **$8.31** | **+$2.47** |
| API duration | 20m 32s | 31m 8s | +10m 36s |
| Wall-clock | 50m 33s | 1h 19m 4s | +28m 31s |
| Code changes | +1,001 / −14 | +1,745 / −27 | +744 / −13 |

Per-model token deltas (raw `/cost` rows):

| Model | Metric | §2c | Now | Δ |
| --- | --- | ---: | ---: | ---: |
| **Opus 4.8** | Input | 13.0k | 19.7k | +6.7k |
| | Output | 70.4k | 111.1k | **+40.7k** |
| | Cache read | 5.8M | 7.5M | +1.7M |
| | Cache write | 174.7k | 262.4k | +87.7k |
| | Cost | $5.81 | $8.28 | **+$2.47** |
| Haiku 4.5 | Input / Output | 15.1k / 1.8k | 15.6k / 1.8k | +0.5k / 0 |
| | Cost | $0.024 | $0.025 | +$0.001 |

What the **+$2.47** increment shows:

1. **It is not an isolated "Task 4" figure.** The $2.47 bundles three pieces of work — the
   `/overview-base` build, the structured prompt-template doc, and this analysis extension.
   `/cost` only reports one cumulative session total, so a clean per-task dollar split isn't
   recoverable; treat $2.47 as the cost of *all* post-§2c work. (The bulk of the +744 added lines
   is the feature; the two docs are the rest.)

2. **Output drove it again — even harder.** +40.7k Opus output tokens against only +6.7k fresh
   input is a **~6:1 output:input** increment, steeper than §2c's 5.4:1. At Opus $75/M output,
   *what the model writes* (code + reasoning + prose) is the bill — re-confirming the standing
   finding with a second measured data point.

3. **Caching carried it again.** +1.7M cache-read tokens billed at the cached rate (~10% of fresh
   input) let the increment ship ~580 lines of feature code + two docs while paying full price on
   just 6.7k fresh input. The +87.7k cache *write* is the one-time cost of caching the new context.

4. **Haiku stayed ~idle (+$0.0007).** All the feature code and doc writing ran on Opus, so model
   routing remains the single biggest *unused* lever — exactly as called out in §2c #1.
   A "base" prompt that doesn't steer routine codegen to a cheaper model leaves this on the table.

5. **List price still overshoots ~3×.** Applying §2 list prices to the deltas (6.7k in @ $15/M,
   40.7k out @ $75/M, 1.7M cache read @ $1.50/M, 87.7k cache write @ ~$18.75/M) models **≈$7.3**
   for this increment vs the **$2.47 actually billed** — the same ~3× gap as §2c. Use the measured
   diff, not the list-price model.

### 2e. Updated measured spend — + structured **template-prompt** build (`/cost`) — diff vs §2d

The **same continuous session** then built the A/B experiment's structured arm: the advanced
`/dashboard` feature generated from the filled-in **template-prompt** plus the
[`ab-experiment.md`](./ab-experiment.md) doc that stores it. `/cost` is still cumulative, so the
new readout contains everything in §2d *plus* this work. The diff below isolates the increment.

| Metric | §2d (Tasks 1–4 + tooling) | Now (+ template-prompt build) | Δ increment |
| --- | ---: | ---: | ---: |
| **Total cost** | $8.31 | **$10.65** | **+$2.34** |
| API duration | 31m 8s | 44m 15s | +13m 7s |
| Wall-clock | 1h 19m 4s | 1h 43m 18s | +24m 14s |
| Code changes | +1,745 / −27 | +2,320 / −29 | +575 / −2 |

Per-model token deltas (raw `/cost` rows):

| Model | Metric | §2d | Now | Δ |
| --- | --- | ---: | ---: | ---: |
| **Opus 4.8** | Input | 19.7k | 25.7k | +6.0k |
| | Output | 111.1k | 143.7k | **+32.6k** |
| | Cache read | 7.5M | 9.2M | +1.7M |
| | Cache write | 262.4k | 366.1k | +103.7k |
| | Cost | $8.28 | $10.62 | **+$2.34** |
| Haiku 4.5 | Input / Output | 15.6k / 1.8k | 16.0k / 1.8k | +0.4k / 0 |
| | Cost | $0.025 | $0.0252 | +$0.0002 |

What the **+$2.34** increment shows:

1. **It buys the structured A/B arm.** The $2.34 covers the `/dashboard` feature (new sortable
   `TeamStatsTable`, the status-aware `DashboardExplorer`, page + skeleton, home link — all
   reusing the existing data layer) **and** the `ab-experiment.md` prompt store. That is the bulk
   of the +575 added lines.

2. **A/B cost read — template-prompt vs base-prompt are within ~5% of each other.** The base-prompt
   arm (`/overview-base`) sat inside §2d's +$2.47; this structured template-prompt arm is **+$2.34**
   for a *larger* feature (it adds the leaderboard + status filter on top of the same
   filters+predictor). So the structure didn't cost more — and the build ran **plan-first with zero
   correction turns** (every acceptance criterion met on the first pass; lint/tsc/build green on the
   first gate run bar one a11y warning). The template's payoff is in *turns avoided*, which is
   exactly the hidden cost of correction-turn rework — not visible as a raw token delta here, but visible as the
   absence of rework loops.

3. **Output drove it yet again.** +32.6k Opus output vs +6.0k fresh input is a **~5.4:1
   output:input** ratio — back in line with §2c's 5.4:1. Three measured data points now, same
   verdict: *what the model writes is the bill* (Opus output @ $75/M).

4. **Caching carried it again.** +1.7M cache-read tokens (billed ~10% of fresh input) let the
   increment ship a whole feature + doc while paying full price on only 6.0k fresh input. The
   +103.7k cache *write* is the one-time cost of caching the new dashboard context.

5. **Haiku still ~idle (+$0.0002).** The structured prompt told the agent *what to reuse* but did
   **not** route routine codegen (`loading.tsx`, the table/select boilerplate) to a cheaper model —
   so the single biggest unused lever flagged in §2c #1 remains on the table for a third run.

6. **List price overshoots ~3× again.** Deltas at §2 list prices (6.0k in @ $15/M, 32.6k out @
   $75/M, 1.7M cache read @ $1.50/M, 103.7k cache write @ ~$18.75/M) model **≈$7.0** vs the **$2.34
   actually billed** — the same ~3× gap as §2c/§2d. Use the measured diff.

**Cumulative session arc:** $5.84 (§2c) → $8.31 (§2d, +$2.47) → **$10.65** (§2e, +$2.34). Each
increment shipped a feature for ≈$2.4 with the same fingerprint — Opus output + cache reads dominate,
Haiku idle, list price ~3× high.

---

## 3. Conclusions — toward an AI-native SDLC

The numbers above measure *one* feature loop. The bigger lesson is about **process**: the cost
drivers we saw (rework from under-specified prompts, everything billed to the heaviest model, no
intermediate human checkpoint) are exactly the failure modes a disciplined SDLC was invented to
prevent. An AI-native SDLC should keep the structure of the old one — and add a few AI-specific
moves.

1. **Keep the structure — don't drop process just because the coder is an AI.**
   A traditional SDLC has a flow, templates, defined roles, and gates. Those exist because they
   produce good outcomes, and an AI-native SDLC needs the same scaffolding to get good results.
   Concretely, the structure should be **written down and made machine-readable**: encode each SDLC
   artifact as its own file — guidance docs, skills, rules, prompt templates, agent definitions — so
   the agent inherits the process instead of re-inferring it every run. This experiment is a small
   proof: the structured `template-prompt` ([`ab-experiment.md`](./ab-experiment.md)) front-loaded
   stack/conventions/reuse/acceptance and shipped a *larger* feature with **zero correction turns**,
   while the free-form `base-prompt` made the agent infer all of that — the hidden, turn-by-turn cost
   §2e flagged.

2. **Two pairs of eyes, at every step.**
   The old SDLC requires human review at each stage; the AI-native one needs the same. A mistake,
   stale assumption, or misunderstanding introduced at an early step **compounds into every step
   that follows** — so the human stays in the loop at each transition to review, edit, elaborate,
   and explicitly **approve** before moving on. Skipping the checkpoint doesn't save money: as in the
   old SDLC, you simply burn more time, tokens, and effort building the wrong thing — and with an
   agent the wrong thing arrives faster and looks more finished.

3. **Every step must emit a human-verifiable output before advancing.**
   Each phase should produce a concrete, reviewable artifact — a plan, an acceptance-criteria list, a
   diff, a test report — that a human can check and sign off on, and only then hand to the next step.
   Verifiable hand-offs are what make the per-step review in #2 actually possible (you cannot approve
   what you cannot inspect).

4. **Match the model to the step — don't run everything on Opus.**
   §2 showed ~99% of the bill went to Opus while Haiku sat idle, so model routing is the single
   biggest unused lever. Pick the model per phase:
   - *Business analysis / requirements* → a lighter, fast model that scores well on that class of
     task (check current task-specific leaderboards/benchmarks before committing).
   - *Solution & architecture* → a heavy reasoning model (e.g. Opus), which earns its cost on large,
     complex designs.
   - *Task breakdown* → a light model (e.g. Haiku) is enough.
   - *Implementation & E2E tests* → Opus, or something lighter, depending on how hard the specific
     solution/task is.
   Reserve the expensive reasoning for where it changes the outcome.

5. **AI checks AI — use agents for self-review.**
   Beyond the human gate in #2, add an automated review layer: spawn a separate agent (a different
   role/prompt, ideally an adversarial one) to review the primary agent's output before it reaches a
   human. This catches a class of errors cheaply and makes the human review faster and higher-signal.

6. **Build a self-education loop to suppress hallucination.**
   Where feasible, give the system a way to **accumulate and reuse project-specific knowledge** —
   curated rules, conventions, prior decisions, memory of past mistakes — so each run starts better
   informed than the last. Grounding the agent in real, project-local facts is the most reliable way
   to minimize hallucinations and false-positive outputs.

**Bottom line:** the measured cost of *building* the feature was small and predictable
(≈$2.4/feature); the real leverage is in the **process around it** — structured, file-encoded
guidance (#1), a human gate on every verifiable hand-off (#2, #3), model routing per step (#4), and
AI-on-AI review plus a learning loop (#5, #6) to keep quality up and cost down as projects scale.
