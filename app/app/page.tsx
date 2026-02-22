"use client";

import type { EventItem, ListEventsResponse } from "@/lib/events";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const PAGE_SIZE = 12;
const SEARCH_DEBOUNCE_MS = 300;

function formatEventDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

async function getEvents(options: {
  cursor?: string;
  name?: string;
}): Promise<ListEventsResponse> {
  const params = new URLSearchParams({ limit: String(PAGE_SIZE) });

  if (options.cursor) {
    params.set("cursor", options.cursor);
  }

  if (options.name) {
    params.set("name", options.name);
  }

  const response = await fetch(`/api/events?${params.toString()}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Events request failed with ${response.status}.`);
  }

  return (await response.json()) as ListEventsResponse;
}

function EventCard({ event }: { event: EventItem }) {
  return (
    <Link href={`/events/${event.id}`} className="block">
      <article className="rounded-2xl border border-white/70 bg-white/85 p-6 shadow-md backdrop-blur transition hover:-translate-y-0.5 hover:shadow-lg">
        <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase">
          {event.venue.name}
        </p>
        <h2 className="mt-2 text-xl font-semibold tracking-tight text-zinc-800">
          {event.name}
        </h2>
        <p className="mt-3 text-sm text-zinc-600">
          {formatEventDate(event.eventDatetime)}
        </p>
        <div className="mt-6 flex items-center justify-between border-t border-zinc-200/70 pt-4 text-sm">
          <span className="text-zinc-500">From</span>
          <span className="font-semibold text-zinc-700">
            ${event.gaPrice.toFixed(2)}
          </span>
        </div>
      </article>
    </Link>
  );
}

export default function Home() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSearchTerm(searchInput.trim());
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [searchInput]);

  useEffect(() => {
    let mounted = true;

    const loadInitial = async () => {
      setLoading(true);

      try {
        const response = await getEvents({ name: searchTerm || undefined });
        if (!mounted) return;

        setEvents(response.events);
        setNextCursor(response.nextCursor);
        setHasMore(response.hasMore);
        setError(null);
      } catch (loadError) {
        if (!mounted) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load events.",
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadInitial();

    return () => {
      mounted = false;
    };
  }, [searchTerm]);

  const canLoadMore = useMemo(
    () => hasMore && !!nextCursor && !loading && !loadingMore,
    [hasMore, nextCursor, loading, loadingMore],
  );

  const loadMore = async () => {
    if (!nextCursor || loadingMore) {
      return;
    }

    setLoadingMore(true);

    try {
      const response = await getEvents({
        cursor: nextCursor,
        name: searchTerm || undefined,
      });
      setEvents((current) => [...current, ...response.events]);
      setNextCursor(response.nextCursor);
      setHasMore(response.hasMore);
      setError(null);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load events.",
      );
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-r from-blue-50 via-white to-red-50 px-6 py-12">
      <section className="mx-auto w-full max-w-6xl">
        <header className="mb-8">
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-700">
            Ticket booking
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            Choose an event and start your booking.
          </p>
        </header>

        <div className="mb-6">
          <label htmlFor="event-search" className="sr-only">
            Search events
          </label>
          <input
            id="event-search"
            type="search"
            value={searchInput}
            onChange={(event) => {
              setSearchInput(event.target.value);
            }}
            placeholder="Search events by name"
            className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-700 shadow-sm outline-none transition focus:border-zinc-500"
          />
        </div>

        {error ? (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-2xl border border-white/70 bg-white/85 p-10 text-center text-zinc-600 shadow-md backdrop-blur">
            Loading events...
          </div>
        ) : null}

        {!loading && events.length === 0 ? (
          <div className="rounded-2xl border border-white/70 bg-white/85 p-10 text-center text-zinc-600 shadow-md backdrop-blur">
            No events found.
          </div>
        ) : null}

        {!loading && events.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>

            <div className="mt-8 flex items-center justify-between gap-4">
              <p className="text-sm text-zinc-600">
                {events.length} events loaded
              </p>
              <button
                type="button"
                onClick={() => {
                  void loadMore();
                }}
                disabled={!canLoadMore}
                className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loadingMore
                  ? "Loading..."
                  : hasMore
                    ? "Load more"
                    : "All loaded"}
              </button>
            </div>
          </>
        ) : null}
      </section>
    </main>
  );
}
