"use client";

import type { EventAvailability, EventItem } from "@/lib/events";
import { useEffect, useState } from "react";

type EventDetailsPageProps = {
  params: Promise<{ id: string }>;
};

function formatEventDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatPrice(value: number): string {
  return `$${value.toFixed(2)}`;
}

export default function EventDetailsPage({ params }: EventDetailsPageProps) {
  const [event, setEvent] = useState<EventItem | null>(null);
  const [availability, setAvailability] = useState<EventAvailability | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let availabilityIntervalId: ReturnType<typeof setInterval> | undefined;

    const refreshAvailability = async (eventId: string) => {
      try {
        const response = await fetch(`/api/events/${eventId}/availability`, {
          cache: "no-store",
        });

        if (!response.ok) return;

        const payload = (await response.json()) as EventAvailability;
        if (!mounted) return;
        setAvailability(payload);
      } catch {
        // Ignore transient polling failures and keep last known availability.
      }
    };

    const load = async () => {
      try {
        const resolvedParams = await params;
        if (!mounted) return;

        const [eventResponse, availabilityResponse] = await Promise.all([
          fetch(`/api/events/${resolvedParams.id}`, { cache: "no-store" }),
          fetch(`/api/events/${resolvedParams.id}/availability`, {
            cache: "no-store",
          }),
        ]);

        if (!eventResponse.ok) {
          throw new Error(`Event request failed with ${eventResponse.status}.`);
        }

        if (!availabilityResponse.ok) {
          throw new Error(
            `Availability request failed with ${availabilityResponse.status}.`,
          );
        }

        const eventPayload = (await eventResponse.json()) as EventItem;
        const availabilityPayload =
          (await availabilityResponse.json()) as EventAvailability;

        if (!mounted) return;

        setEvent(eventPayload);
        setAvailability(availabilityPayload);
        setError(null);

        availabilityIntervalId = setInterval(() => {
          void refreshAvailability(resolvedParams.id);
        }, 5000);
      } catch (loadError) {
        if (!mounted) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load event.",
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      mounted = false;
      if (availabilityIntervalId) {
        clearInterval(availabilityIntervalId);
      }
    };
  }, [params]);

  return (
    <main className="min-h-screen bg-gradient-to-r from-blue-50 via-white to-red-50 px-6 py-12">
      <section className="mx-auto w-full max-w-4xl">
        {loading ? (
          <div className="rounded-2xl border border-white/70 bg-white/85 p-10 text-center text-zinc-600 shadow-md backdrop-blur">
            Loading event details...
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {!loading && !error && event && availability ? (
          <article className="space-y-10">
            <header className="text-center">
              <p className="text-xs font-semibold tracking-[0.22em] text-zinc-500 uppercase">
                {event.venue.name}
              </p>
              <h1 className="mt-3 text-5xl font-semibold tracking-tight text-zinc-900 md:text-6xl">
                {event.name}
              </h1>
              <p className="mt-4 text-sm text-zinc-600">
                {formatEventDate(event.eventDatetime)}
              </p>
            </header>

            <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-2xl bg-white/70 p-5 text-center shadow-sm backdrop-blur-sm">
                <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase">
                  VIP
                </p>
                <p className="mt-2 text-3xl font-semibold text-zinc-900">
                  {formatPrice(event.vipPrice)}
                </p>
              </div>

              <div className="rounded-2xl bg-white/70 p-5 text-center shadow-sm backdrop-blur-sm">
                <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase">
                  First Row
                </p>
                <p className="mt-2 text-3xl font-semibold text-zinc-900">
                  {formatPrice(event.firstRowPrice)}
                </p>
              </div>

              <div className="rounded-2xl bg-white/70 p-5 text-center shadow-sm backdrop-blur-sm">
                <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase">
                  General Admission
                </p>
                <p className="mt-2 text-3xl font-semibold text-zinc-900">
                  {formatPrice(event.gaPrice)}
                </p>
              </div>
            </section>

            <section className="rounded-3xl bg-white/75 p-6 shadow-sm backdrop-blur-sm md:p-8">
              <h2 className="text-center text-lg font-semibold text-zinc-800">
                Seats Available
              </h2>
              <div className="mt-4">
                <div className="mx-auto w-[48%] rounded-xl bg-zinc-900 px-4 py-3 text-center text-white shadow-md">
                  <p className="text-3xl font-bold tracking-tight text-emerald-100">
                    {availability.availableTickets.total}
                  </p>
                  <p className="text-xs font-semibold tracking-wider uppercase text-zinc-200">
                    Total available seats
                  </p>
                </div>

                <div className="mt-5">
                  <div className="mx-auto w-full rounded-xl bg-slate-200 px-3 pt-3 pb-14 text-center shadow-md">
                    <div className="mx-auto w-[60%] rounded-xl bg-emerald-200 p-3 shadow-sm">
                      <div className="mx-auto w-[42%] rounded-lg bg-amber-200 px-3 py-2 shadow-sm">
                        <p className="text-xs font-semibold tracking-wider text-amber-900 uppercase">
                          VIP
                        </p>
                        <p className="mt-1 text-xl font-bold text-amber-900">
                          {availability.availableTickets.vip}
                        </p>
                      </div>

                      <p className="mt-3 text-xs font-semibold tracking-wider text-emerald-900 uppercase">
                        First Row
                      </p>
                      <p className="mt-1 text-2xl font-bold text-emerald-900">
                        {availability.availableTickets.firstRow}
                      </p>
                    </div>

                    <p className="mt-3 text-xs font-semibold tracking-wider text-slate-900 uppercase">
                      GA
                    </p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">
                      {availability.availableTickets.ga}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </article>
        ) : null}
      </section>
    </main>
  );
}
