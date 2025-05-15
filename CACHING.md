# Caching System Documentation

The Liquipedia Scraper API implements an in-memory caching system to improve performance and reduce the load on Liquipedia's servers. This document explains how the caching works and how to manage it.

## Cache Implementation

- The caching system uses `node-cache` to store responses in memory
- Each resource type has its own TTL (Time-To-Live) value:
  - Players: 1 hour (3600 seconds)
  - Upcoming matches: 15 minutes (900 seconds)
  - Tournament results: 1 hour (3600 seconds)

## Cache Keys

Cache keys are generated using the following format:
```
{resourceType}:{game}:{team}:{date?}
```

Examples:
- `players:valorant:fnatic`
- `upcoming-matches:leagueoflegends:t1:22-05-2023`
- `results:rocketleague:g2`

## Cache Management API

The API includes endpoints to manage the cache:

### Get Cache Statistics

```
GET /cache/stats
```

Returns statistics about the cache, including hits, misses, and keys.

### Clear All Cache

```
DELETE /cache/clear
```

Clears all items from the cache.

### Clear Team/Game Specific Cache

```
DELETE /cache/{game}/{team}
```

Clears cache entries for a specific team and game.

## Cache Behavior

- Cache is only applied to successful `GET` requests
- Error responses (status >= 400) are not cached
- Cache is automatically invalidated after the TTL expires
- The cache is in-memory, so it will be cleared if the server restarts

## Implementation Details

The cache middleware is implemented in `src/middlewares/cache.middleware.ts` and works by:
1. Intercepting incoming requests
2. Checking if a cached response exists
3. If found, returning the cached response immediately
4. If not found, capturing the response and storing it in the cache before sending it to the client

The `CacheService` singleton is implemented in `src/services/cache.service.ts` and provides methods to get, set, and delete cache entries.
