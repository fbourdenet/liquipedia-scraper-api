export const playersSchema = {
  params: {
    type: "object",
    properties: {
      team: { type: "string", minLength: 1 },
      game: { type: "string", minLength: 1 },
    },
    required: ["team", "game"],
  },
  querystring: {
    type: "object",
    properties: {
      active: { 
        type: ["boolean"],
      },
      date: { type: "string" },
    },
  },
};

export const upcomingMatchesSchema = {
  params: {
    type: "object",
    properties: {
      team: { type: "string", minLength: 1 },
      game: { type: "string", minLength: 1 },
    },
    required: ["team", "game"],
  },
  querystring: {
    type: "object",
    properties: {
      active: { 
        type: ["boolean"],
      },
      date: { type: "string" },
    },
  },
};

export const tournamentResultsSchema = {
  params: {
    type: "object",
    properties: {
      team: { type: "string", minLength: 1 },
      game: { type: "string", minLength: 1 },
    },
    required: ["team", "game"],
  },
  querystring: {
    type: "object",
    properties: {
      games: { 
        type: ["string", "array"],
        items: { type: "string" }
      },
      date: { type: "string" },
    },
  },
};

