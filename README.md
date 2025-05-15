# liquipedia-scraper-api

A Node.js API that scrapes data from Liquipedia for esports teams, matches, and tournament results.

## Features

- Get team roster information
- Get upcoming matches
- Get tournament results
- Caching system for improved performance

## Documentation

- For caching information, see [CACHING.md](CACHING.md)

## Setup

1. Clone the repository
2. Install dependencies with `npm install`
3. Create a `.env` file based on the example
4. Run the development server with `npm run dev`

## API Endpoints

### Teams & Players

```
GET /liquipedia/:game/:team/players
```

### Upcoming Matches

```
GET /liquipedia/:game/:team/upcoming-matches
```

Query parameters:
- `date`: Filter matches by date (format: DD-MM-YYYY)

### Tournament Results

```
GET /liquipedia/:game/:team/results
```

Query parameters:
- `date`: Filter results by date (format: DD-MM-YYYY)

### Cache Management

```
GET /cache/stats
DELETE /cache/clear
DELETE /cache/:game/:team
```

## Authentication

Authentication is handled via Bearer tokens. Set your API key in the `.env` file and include it in the Authorization header:

```
Authorization: Bearer your-api-key
```

Authentication is disabled in development mode.