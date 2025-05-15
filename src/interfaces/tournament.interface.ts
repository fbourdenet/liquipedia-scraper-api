export interface TournamentResult {
  date: string | null;
  placement: string;
  tier: string;
  tournament: Tournament;
  score: TournamentResultScore;
  prize: number | null;
  isWin: boolean | null;
}

interface Tournament {
  name: string | null;
  game: string | null;
  icon: string | null;
}

interface Team {
  name: string | null;
  icon: string | null;
  score: string | null;
}

interface TournamentResultScore {
  teamLeft: Team;
  teamRight: Team;
}
