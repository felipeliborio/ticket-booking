import { fetchEventById } from "@/lib/events";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type CacheEntry = {
  value: unknown;
  expiresAt: number;
};

const EVENT_DETAILS_CACHE_TTL_MS = 5000;
const MAX_EVENT_DETAILS_CACHE_SIZE = 100;
const cache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<unknown>>();

function trimCache(): void {
  while (cache.size > MAX_EVENT_DETAILS_CACHE_SIZE) {
    const oldestKey = cache.keys().next().value as string | undefined;
    if (!oldestKey) {
      break;
    }
    cache.delete(oldestKey);
  }
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const now = Date.now();
    const cached = cache.get(id);
    if (cached && cached.expiresAt > now) {
      cache.delete(id);
      cache.set(id, cached);
      return NextResponse.json(cached.value);
    }

    if (cached) {
      cache.delete(id);
    }

    const running = inFlight.get(id);
    if (running) {
      return NextResponse.json(await running);
    }

    const requestPromise = (async () => {
      const event = await fetchEventById(id);
      cache.set(id, {
        value: event,
        expiresAt: Date.now() + EVENT_DETAILS_CACHE_TTL_MS,
      });
      trimCache();
      return event;
    })();

    inFlight.set(id, requestPromise);

    try {
      const event = await requestPromise;
      return NextResponse.json(event);
    } finally {
      inFlight.delete(id);
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch event.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
