export const upcomingMatchesSchema = {
  params: {
    type: "object",
    properties: {
      team: { type: "string" },
    },
    required: ["team"],
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
