export interface Team {
    name: string | null;
    icon: string | null;
  }
  
  export interface Tournament {
    name: string | null;
    game: string | null;
    link: string | null;
  }
  
  export interface Match {
    teamLeft: Team;
    teamRight: Team;
    tournament: Tournament;
    dateTime: string | null;
    format: string | null;
  }
  