"use client";

import { useEffect, useState } from "react";
import { USER_ID_STORAGE_KEY } from "@/lib/user";

type BookingItem = {
  id: string;
  event: {
    id: string;
    name: string;
    eventDatetime: string;
    venueName: string;
  };
  status: "pending" | "success" | "failure";
  bookedSeats: {
    vip: number;
    firstRow: number;
    ga: number;
    total: number;
  };
  createdAt: string;
  updatedAt: string;
  totalCost: number;
};

type ListBookingsResponse = {
  bookings: BookingItem[];
  found: number;
};

type PayBookingResponse = {
  bookingId: string;
  status: "success" | "failure";
  updatedAt: string;
};

const BOOKING_PAYMENT_WINDOW_MS = 5 * 60 * 1000;

function getUserId(): string | null {
  return window.localStorage.getItem(USER_ID_STORAGE_KEY);
}

function getOrCreateUserId(): string {
  const currentValue = getUserId();
  if (currentValue) {
    return currentValue;
  }

  const nextValue = crypto.randomUUID();
  window.localStorage.setItem(USER_ID_STORAGE_KEY, nextValue);
  return nextValue;
}

function formatDate(value: string): string {
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

function formatCountdown(totalSeconds: number): string {
  const safeSeconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [selectedPendingBooking, setSelectedPendingBooking] =
    useState<BookingItem | null>(null);
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [countdownNowMs, setCountdownNowMs] = useState(() => Date.now());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadBookings = async () => {
      const userId = getOrCreateUserId();

      try {
        const response = await fetch(
          `/api/bookings?userId=${encodeURIComponent(userId)}`,
          {
            cache: "no-store",
          },
        );

        const payload = (await response.json().catch(() => null)) as
          | ListBookingsResponse
          | { message?: string }
          | null;

        if (!response.ok) {
          throw new Error(
            payload &&
            "message" in payload &&
            typeof payload.message === "string"
              ? payload.message
              : `Bookings request failed with ${response.status}.`,
          );
        }

        if (!mounted) return;
        setBookings((payload as ListBookingsResponse).bookings);
        setError(null);
      } catch (loadError) {
        if (!mounted) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load bookings.",
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadBookings();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (
      !selectedPendingBooking ||
      selectedPendingBooking.status !== "pending"
    ) {
      return;
    }

    const intervalId = setInterval(() => {
      setCountdownNowMs(Date.now());
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [selectedPendingBooking]);

  const handleSetPaymentStatus = async (status: "success" | "failure") => {
    if (
      !selectedPendingBooking ||
      selectedPendingBooking.status !== "pending"
    ) {
      return;
    }

    setPaymentSubmitting(true);
    setPaymentError(null);

    try {
      const response = await fetch("/api/payment", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          bookingId: selectedPendingBooking.id,
          status,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | PayBookingResponse
        | { message?: string }
        | null;

      if (!response.ok) {
        throw new Error(
          payload && "message" in payload && typeof payload.message === "string"
            ? payload.message
            : `Payment request failed with ${response.status}.`,
        );
      }

      setBookings((currentBookings) =>
        currentBookings.map((booking) =>
          booking.id === selectedPendingBooking.id
            ? {
                ...booking,
                status,
                updatedAt: (payload as PayBookingResponse).updatedAt,
              }
            : booking,
        ),
      );
      setSelectedPendingBooking((currentBooking) =>
        currentBooking
          ? {
              ...currentBooking,
              status,
              updatedAt: (payload as PayBookingResponse).updatedAt,
            }
          : null,
      );
    } catch (paymentUpdateError) {
      setPaymentError(
        paymentUpdateError instanceof Error
          ? paymentUpdateError.message
          : "Failed to update payment.",
      );
    } finally {
      setPaymentSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-linear-to-r from-blue-50 via-white to-red-50 px-6 py-12">
      <section className="mx-auto w-full max-w-6xl">
        <header className="mb-8">
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-700">
            My bookings
          </h1>
        </header>

        {loading ? (
          <div className="rounded-2xl border border-white/70 bg-white/85 p-10 text-center text-zinc-600 shadow-md backdrop-blur">
            Loading bookings...
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {!loading && !error && bookings.length === 0 ? (
          <div className="flex min-h-[50vh] items-center justify-center text-center">
            <p className="text-4xl font-semibold tracking-tight text-zinc-500">
              No bookings yet.
            </p>
          </div>
        ) : null}

        {!loading && !error && bookings.length > 0 ? (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <article
                key={booking.id}
                className="rounded-2xl bg-white/80 p-5 shadow-sm backdrop-blur-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-2xl font-semibold text-zinc-600">
                      {booking.event.name}
                    </p>
                    <p className="mt-1 text-base text-zinc-600">
                      {booking.event.venueName}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {formatDate(booking.event.eventDatetime)}
                    </p>
                  </div>
                  <span
                    className={
                      booking.status === "success"
                        ? "rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase text-emerald-700"
                        : booking.status === "failure"
                          ? "rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold uppercase text-rose-700"
                          : "rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase text-amber-700"
                    }
                  >
                    {booking.status}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-zinc-700 sm:grid-cols-4">
                  <p>VIP: {booking.bookedSeats.vip}</p>
                  <p>First Row: {booking.bookedSeats.firstRow}</p>
                  <p>GA: {booking.bookedSeats.ga}</p>
                  <p className="font-semibold">
                    Total: {booking.bookedSeats.total}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between gap-4">
                  <p className="text-xs text-zinc-500">
                    Booked on {formatDate(booking.createdAt)}
                  </p>
                  <div className="flex flex-col items-end gap-2">
                    <p className="text-right text-sm font-semibold text-zinc-800">
                      Total cost: {formatPrice(booking.totalCost)}
                    </p>
                    {booking.status === "pending" ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPendingBooking(booking);
                          setPaymentError(null);
                          setCountdownNowMs(Date.now());
                        }}
                        className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-zinc-700"
                      >
                        Complete payment
                      </button>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </main>
  );
}
