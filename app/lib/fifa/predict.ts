// Heuristic match predictor. This is a lightweight demo model derived from the
// goals scored/conceded in *completed* matches in the current dataset — it is
// not a real forecasting model. With sparse data, teams fall back to the
// league-average baseline, so predictions stay sensible rather than extreme.

import type { FifaMatch, FifaTeam } from "./types";

/** Aggregated form for a single team across completed matches. */
export interface TeamForm {
  team: FifaTeam;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
}

export interface Prediction {
  /** Win/draw/win probabilities for the home team, summing to ~1. */
  homeWin: number;
  draw: number;
  awayWin: number;
  /** Rounded expected scoreline. */
  scoreHome: number;
  scoreAway: number;
  /** Continuous expected goals behind the rounded scoreline. */
  expectedHome: number;
  expectedAway: number;
}

// Modest goals-per-team advantage for playing at home.
const HOME_ADVANTAGE = 0.3;
// Fallback goals-per-game when the dataset has no completed matches at all.
const DEFAULT_AVG_GOALS = 1.3;

// Draw probability tapers from a baseline as the expected-goals margin grows,
// clamped to a sane band so evenly-matched or lopsided games stay realistic.
const BASE_DRAW_PROB = 0.32;
const DRAW_SENSITIVITY = 0.14;
const MAX_DRAW_PROB = 0.34;
const MIN_DRAW_PROB = 0.1;

function isCompleted(match: FifaMatch): boolean {
  return (
    match.status === "completed" &&
    match.home_score !== null &&
    match.away_score !== null
  );
}

function emptyForm(team: FifaTeam): TeamForm {
  return {
    team,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
  };
}

function addResult(form: TeamForm, scored: number, conceded: number): void {
  form.played += 1;
  form.goalsFor += scored;
  form.goalsAgainst += conceded;
  if (scored > conceded) form.wins += 1;
  else if (scored < conceded) form.losses += 1;
  else form.draws += 1;
}

/** Build a per-team form table keyed by team id from completed matches. */
export function buildForm(matches: FifaMatch[]): Map<number, TeamForm> {
  const table = new Map<number, TeamForm>();

  const ensure = (team: FifaTeam): TeamForm => {
    let form = table.get(team.id);
    if (!form) {
      form = emptyForm(team);
      table.set(team.id, form);
    }
    return form;
  };

  for (const match of matches) {
    // Register both teams even if they have not completed a match yet, so they
    // remain selectable in the predictor.
    ensure(match.home_team);
    ensure(match.away_team);

    if (!isCompleted(match)) continue;
    const home = match.home_score as number;
    const away = match.away_score as number;
    addResult(ensure(match.home_team), home, away);
    addResult(ensure(match.away_team), away, home);
  }

  return table;
}

/** League-wide average goals scored per team per completed match. */
function leagueAverageGoals(matches: FifaMatch[]): number {
  let goals = 0;
  let games = 0;
  for (const match of matches) {
    if (!isCompleted(match)) continue;
    goals += (match.home_score as number) + (match.away_score as number);
    games += 1;
  }
  // Two team-performances per match, hence games * 2.
  return games > 0 ? goals / (games * 2) : DEFAULT_AVG_GOALS;
}

function attackRate(form: TeamForm | undefined, baseline: number): number {
  if (!form || form.played === 0) return baseline;
  return form.goalsFor / form.played;
}

function defenceRate(form: TeamForm | undefined, baseline: number): number {
  if (!form || form.played === 0) return baseline;
  return form.goalsAgainst / form.played;
}

/**
 * Predict the outcome of home vs. away using their form. Expected goals blend a
 * team's attack with the opponent's defence; probabilities derive from the
 * expected-goals margin via a logistic split, with draws more likely when the
 * teams are evenly matched.
 */
export function predictMatch(
  homeId: number,
  awayId: number,
  form: Map<number, TeamForm>,
  matches: FifaMatch[],
): Prediction {
  const baseline = leagueAverageGoals(matches);
  const homeForm = form.get(homeId);
  const awayForm = form.get(awayId);

  const expectedHome = Math.max(
    0,
    (attackRate(homeForm, baseline) + defenceRate(awayForm, baseline)) / 2 +
      HOME_ADVANTAGE,
  );
  const expectedAway = Math.max(
    0,
    (attackRate(awayForm, baseline) + defenceRate(homeForm, baseline)) / 2,
  );

  const margin = expectedHome - expectedAway;

  // Closer expected scores => higher draw chance (clamped to a sane band).
  const draw = Math.min(
    MAX_DRAW_PROB,
    Math.max(MIN_DRAW_PROB, BASE_DRAW_PROB - DRAW_SENSITIVITY * Math.abs(margin)),
  );
  const decisive = 1 - draw;
  const homeShare = 1 / (1 + Math.exp(-1.6 * margin));

  return {
    homeWin: decisive * homeShare,
    draw,
    awayWin: decisive * (1 - homeShare),
    scoreHome: Math.round(expectedHome),
    scoreAway: Math.round(expectedAway),
    expectedHome,
    expectedAway,
  };
}
