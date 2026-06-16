// Types mirroring the BALLDONTLIE FIFA World Cup OpenAPI spec
// (https://www.balldontlie.io/openapi/fifa.yml). Only the fields the
// dashboard consumes are modelled.

export type MatchStatus =
  | "scheduled"
  | "in_progress"
  | "completed"
  | "postponed"
  | "cancelled";

export interface FifaTeam {
  id: number;
  name: string;
  abbreviation: string;
  country_code: string;
  confederation: string;
}

export interface FifaStadium {
  id: number;
  name: string;
  city: string;
  country: string;
}

export interface FifaStage {
  id: number;
  name: string;
  order: number;
}

export interface FifaGroup {
  id: number;
  name: string;
}

export interface FifaSeason {
  id: number;
  year: number;
}

export interface FifaMatch {
  id: number;
  match_number: number;
  datetime: string; // ISO 8601, UTC
  status: MatchStatus;
  clock_display: string | null;
  season: FifaSeason;
  stage: FifaStage;
  group: FifaGroup | null;
  stadium: FifaStadium;
  home_team: FifaTeam;
  away_team: FifaTeam;
  home_score: number | null;
  away_score: number | null;
  home_score_penalties: number | null;
  away_score_penalties: number | null;
}

export interface FifaMatchesResponse {
  data: FifaMatch[];
  meta: {
    next_cursor?: number;
    per_page: number;
  };
}
