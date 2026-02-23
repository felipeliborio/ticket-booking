import { fetchEvents } from "@/lib/events";
import { NextResponse } from "next/server";

type CacheEntry = {
  value: unknown;
  expiresAt: number;
};

const EVENTS_LIST_CACHE_TTL_MS = 1000;
const MAX_EVENTS_LIST_CACHE_SIZE = 1000;
const cache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<unknown>>();

function trimCache(): void {
  while (cache.size > MAX_EVENTS_LIST_CACHE_SIZE) {
    const oldestKey = cache.keys().next().value as string | undefined;
    if (!oldestKey) {
      break;
    }
    cache.delete(oldestKey);
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit");
    const cursor = searchParams.get("cursor");
    const name = searchParams.get("name");
    const cacheKey = JSON.stringify({
      limit: limit ?? null,
      cursor: cursor ?? null,
      name: name ?? null,
    });

    const now = Date.now();
    const cached = cache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
      cache.delete(cacheKey);
      cache.set(cacheKey, cached);
      return NextResponse.json(cached.value);
    }

    if (cached) {
      cache.delete(cacheKey);
    }

    const running = inFlight.get(cacheKey);
    if (running) {
      return NextResponse.json(await running);
    }

    const requestPromise = (async () => {
      const events = await fetchEvents({
        limit: limit ? Number.parseInt(limit, 10) : undefined,
        cursor: cursor ?? undefined,
        name: name ?? undefined,
      });
      cache.set(cacheKey, {
        value: events,
        expiresAt: Date.now() + EVENTS_LIST_CACHE_TTL_MS,
      });
      trimCache();
      return events;
    })();

    inFlight.set(cacheKey, requestPromise);

    try {
      const events = await requestPromise;
      return NextResponse.json(events);
    } finally {
      inFlight.delete(cacheKey);
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch events.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
