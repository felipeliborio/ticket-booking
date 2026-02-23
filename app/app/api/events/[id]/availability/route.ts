import { fetchEventAvailability } from "@/lib/events";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type CacheEntry = {
  value: unknown;
  expiresAt: number;
};

const AVAILABILITY_CACHE_TTL_MS = 500;
const MAX_AVAILABILITY_CACHE_SIZE = 100;
const cache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<unknown>>();

function trimCache(): void {
  while (cache.size > MAX_AVAILABILITY_CACHE_SIZE) {
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
      const availability = await fetchEventAvailability(id);
      cache.set(id, {
        value: availability,
        expiresAt: Date.now() + AVAILABILITY_CACHE_TTL_MS,
      });
      trimCache();
      return availability;
    })();

    inFlight.set(id, requestPromise);

    try {
      const availability = await requestPromise;
      return NextResponse.json(availability);
    } finally {
      inFlight.delete(id);
    }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch event availability.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
