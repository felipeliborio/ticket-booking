"use client";

import type { EventAvailability, EventItem } from "@/lib/events";
import { useEffect, useState } from "react";

type EventDetailsPageProps = {
  params: Promise<{ id: string }>;
};

type CreateBookingResponse = {
  id: string;
  status: "pending" | "success" | "failure";
  bookedSeats: {
    vip: number;
    firstRow: number;
    ga: number;
    total: number;
  };
  createdAt: string;
  updatedAt: string;
};

const USER_ID_STORAGE_KEY = "ticket-booking-user-id";

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

function getOrCreateUserId(): string {
  const currentValue = window.localStorage.getItem(USER_ID_STORAGE_KEY);
  if (currentValue) {
    return currentValue;
  }

  const createdValue = crypto.randomUUID();
  window.localStorage.setItem(USER_ID_STORAGE_KEY, createdValue);
  return createdValue;
}

function parseSeatInput(value: string): number {
  if (!value.trim()) {
    return 0;
  }

  const parsedValue = Number.parseInt(value, 10);
  if (Number.isNaN(parsedValue) || parsedValue < 0) {
    return 0;
  }

  return parsedValue;
}

function getErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  const maybeMessage = (payload as { message?: unknown }).message;
  if (typeof maybeMessage === "string") {
    return maybeMessage;
  }

  if (Array.isArray(maybeMessage)) {
    return maybeMessage.join(", ");
  }

  return fallback;
}

export default function EventDetailsPage({ params }: EventDetailsPageProps) {
  const [event, setEvent] = useState<EventItem | null>(null);
  const [availability, setAvailability] = useState<EventAvailability | null>(
    null,
  );
  const [userId, setUserId] = useState<string | null>(null);
  const [vipSeats, setVipSeats] = useState(0);
  const [firstRowSeats, setFirstRowSeats] = useState(0);
  const [gaSeats, setGaSeats] = useState(0);
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingResult, setBookingResult] =
    useState<CreateBookingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setUserId(getOrCreateUserId());
  }, []);

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

  const handleCreateBooking = async () => {
    if (!event || !userId) {
      return;
    }

    const seatsTotal = vipSeats + firstRowSeats + gaSeats;
    if (seatsTotal <= 0) {
      setBookingError("Select at least one seat.");
      setBookingResult(null);
      return;
    }

    setBookingSubmitting(true);
    setBookingError(null);

    const bookingId = crypto.randomUUID();

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          userId,
          bookingId,
          eventId: event.id,
          vipSeats,
          firstRowSeats,
          gaSeats,
        }),
      });

      const payload = (await response.json().catch(() => null)) as unknown;

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            payload,
            `Booking request failed with ${response.status}.`,
          ),
        );
      }

      setBookingResult(payload as CreateBookingResponse);
      setVipSeats(0);
      setFirstRowSeats(0);
      setGaSeats(0);

      const availabilityResponse = await fetch(
        `/api/events/${event.id}/availability`,
        {
          cache: "no-store",
        },
      );

      if (availabilityResponse.ok) {
        const availabilityPayload =
          (await availabilityResponse.json()) as EventAvailability;
        setAvailability(availabilityPayload);
      }
    } catch (submitError) {
      setBookingResult(null);
      setBookingError(
        submitError instanceof Error ? submitError.message : "Failed to book.",
      );
    } finally {
      setBookingSubmitting(false);
    }
  };

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
          <>
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

              <section className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                <div className="order-1 rounded-3xl bg-white/75 p-6 shadow-sm backdrop-blur-sm lg:order-2 lg:col-span-2 md:p-8">
                  <h2 className="text-center text-lg font-semibold text-zinc-800">
                    Book Tickets
                  </h2>
                  <p className="mt-2 text-center text-sm text-zinc-600">
                    Select the number of seats per tier.
                  </p>

                  <div className="mt-6 grid grid-cols-1 gap-4">
                    <label className="space-y-2">
                      <span className="text-xs font-semibold tracking-wide text-zinc-600 uppercase">
                        VIP Seats
                      </span>
                      <input
                        type="number"
                        min={0}
                        value={vipSeats}
                        onChange={(inputEvent) => {
                          setVipSeats(parseSeatInput(inputEvent.target.value));
                        }}
                        className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 outline-none transition focus:border-zinc-500"
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-xs font-semibold tracking-wide text-zinc-600 uppercase">
                        First Row Seats
                      </span>
                      <input
                        type="number"
                        min={0}
                        value={firstRowSeats}
                        onChange={(inputEvent) => {
                          setFirstRowSeats(
                            parseSeatInput(inputEvent.target.value),
                          );
                        }}
                        className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 outline-none transition focus:border-zinc-500"
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-xs font-semibold tracking-wide text-zinc-600 uppercase">
                        GA Seats
                      </span>
                      <input
                        type="number"
                        min={0}
                        value={gaSeats}
                        onChange={(inputEvent) => {
                          setGaSeats(parseSeatInput(inputEvent.target.value));
                        }}
                        className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 outline-none transition focus:border-zinc-500"
                      />
                    </label>
                  </div>

                  <div className="mt-5 flex items-center justify-between gap-4">
                    <div className="text-sm text-zinc-600">
                      <p>
                        Total seats:{" "}
                        <span className="font-semibold">
                          {vipSeats + firstRowSeats + gaSeats}
                        </span>
                      </p>
                      <p className="mt-1">
                        Total cost:{" "}
                        <span className="font-semibold text-zinc-800">
                          {formatPrice(
                            vipSeats * event.vipPrice +
                              firstRowSeats * event.firstRowPrice +
                              gaSeats * event.gaPrice,
                          )}
                        </span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        void handleCreateBooking();
                      }}
                      disabled={bookingSubmitting || !userId}
                      className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {bookingSubmitting ? "Booking..." : "Book now"}
                    </button>
                  </div>

                  {bookingError ? (
                    <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                      {bookingError}
                    </p>
                  ) : null}
                </div>

                <div className="order-2 rounded-3xl bg-white/75 p-6 shadow-sm backdrop-blur-sm lg:order-1 lg:col-span-3 md:p-8">
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
                </div>
              </section>
            </article>

            {bookingResult ? (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/45 px-4">
                <div
                  role="dialog"
                  aria-modal="true"
                  className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
                >
                  <h3 className="text-xl font-semibold text-zinc-900">
                    Booking Created
                  </h3>
                  <p className="mt-2 text-sm capitalize text-zinc-600">
                    Status:{" "}
                    <span className="font-semibold text-zinc-800">
                      {bookingResult.status}
                    </span>
                  </p>

                  <div className="mt-5 space-y-2 text-sm text-zinc-700">
                    <p className="flex items-center justify-between">
                      <span>
                        VIP ({bookingResult.bookedSeats.vip} x{" "}
                        {formatPrice(event.vipPrice)})
                      </span>
                      <span className="font-medium">
                        {formatPrice(
                          bookingResult.bookedSeats.vip * event.vipPrice,
                        )}
                      </span>
                    </p>
                    <p className="flex items-center justify-between">
                      <span>
                        First Row ({bookingResult.bookedSeats.firstRow} x{" "}
                        {formatPrice(event.firstRowPrice)})
                      </span>
                      <span className="font-medium">
                        {formatPrice(
                          bookingResult.bookedSeats.firstRow *
                            event.firstRowPrice,
                        )}
                      </span>
                    </p>
                    <p className="flex items-center justify-between">
                      <span>
                        GA ({bookingResult.bookedSeats.ga} x{" "}
                        {formatPrice(event.gaPrice)})
                      </span>
                      <span className="font-medium">
                        {formatPrice(
                          bookingResult.bookedSeats.ga * event.gaPrice,
                        )}
                      </span>
                    </p>
                  </div>

                  <div className="mt-5 border-t border-zinc-200 pt-4">
                    <p className="flex items-center justify-between text-sm text-zinc-700">
                      <span>Total seats</span>
                      <span className="font-semibold">
                        {bookingResult.bookedSeats.total}
                      </span>
                    </p>
                    <p className="mt-2 flex items-center justify-between text-base text-zinc-900">
                      <span className="font-semibold">Total amount</span>
                      <span className="font-semibold">
                        {formatPrice(
                          bookingResult.bookedSeats.vip * event.vipPrice +
                            bookingResult.bookedSeats.firstRow *
                              event.firstRowPrice +
                            bookingResult.bookedSeats.ga * event.gaPrice,
                        )}
                      </span>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setBookingResult(null);
                    }}
                    className="mt-6 w-full rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : null}
          </>
        ) : null}
      </section>
    </main>
  );
}
