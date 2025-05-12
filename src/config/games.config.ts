export const GAMES = [
  "valorant",
  "leagueoflegends",
  "rocketleague",
  "tft",
//   "counterstrike",
//   "overwatch",
//   "apexlegends",
//   "callofduty",
//   "rainbowsix",
] as const;

export const GAME_NAME_MAPPING: { [key: string]: string } = {
  valorant: "Valorant",
  rocketleague: "Rocket League",
  leagueoflegends: "League of Legends",
  tft: "Teamfight Tactics",
  counterstrike: "Counter-Strike",
  overwatch: "Overwatch",
  apexlegends: "Apex Legends",
  callofduty: "Call of Duty",
  rainbowsix: "Rainbow Six Siege",
};
