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
    <main className="min-h-screen bg-gradient-to-r from-blue-50 via-white to-red-50 px-6 py-12">
      <section className="mx-auto w-full max-w-4xl">
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

        {selectedPendingBooking ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/45 px-4"
            onClick={() => {
              setSelectedPendingBooking(null);
              setPaymentError(null);
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              onClick={(clickEvent) => {
                clickEvent.stopPropagation();
              }}
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            >
              <h2 className="text-xl font-semibold text-zinc-900">
                {selectedPendingBooking.event.name}
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                {selectedPendingBooking.event.venueName}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                {formatDate(selectedPendingBooking.event.eventDatetime)}
              </p>

              <div className="mt-4 flex items-center justify-between">
                <p className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">
                  Payment status
                </p>
                <span
                  className={
                    selectedPendingBooking.status === "success"
                      ? "rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase text-emerald-700"
                      : selectedPendingBooking.status === "failure"
                        ? "rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold uppercase text-rose-700"
                        : "rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase text-amber-700"
                  }
                >
                  {selectedPendingBooking.status}
                </span>
              </div>

              {selectedPendingBooking.status === "pending" ? (
                <div className="mt-4 rounded-xl bg-zinc-100 px-4 py-3 text-sm text-zinc-700">
                  <p className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">
                    Time left to pay
                  </p>
                  <p className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">
                    {formatCountdown(
                      Math.floor(
                        Math.max(
                          0,
                          new Date(selectedPendingBooking.createdAt).getTime() +
                            BOOKING_PAYMENT_WINDOW_MS -
                            countdownNowMs,
                        ) / 1000,
                      ),
                    )}
                  </p>
                </div>
              ) : null}

              <div className="mt-5 space-y-2 text-sm text-zinc-700">
                <p className="flex items-center justify-between">
                  <span>VIP</span>
                  <span className="font-medium">
                    {selectedPendingBooking.bookedSeats.vip}
                  </span>
                </p>
                <p className="flex items-center justify-between">
                  <span>First Row</span>
                  <span className="font-medium">
                    {selectedPendingBooking.bookedSeats.firstRow}
                  </span>
                </p>
                <p className="flex items-center justify-between">
                  <span>GA</span>
                  <span className="font-medium">
                    {selectedPendingBooking.bookedSeats.ga}
                  </span>
                </p>
              </div>

              <div className="mt-5 border-t border-zinc-200 pt-4">
                <p className="flex items-center justify-between text-sm text-zinc-700">
                  <span>Total seats</span>
                  <span className="font-semibold">
                    {selectedPendingBooking.bookedSeats.total}
                  </span>
                </p>
                <p className="mt-2 flex items-center justify-between text-base text-zinc-900">
                  <span className="font-semibold">Total amount</span>
                  <span className="font-semibold">
                    {formatPrice(selectedPendingBooking.totalCost)}
                  </span>
                </p>
              </div>

              {paymentError ? (
                <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                  {paymentError}
                </p>
              ) : null}

              {selectedPendingBooking.status === "pending" ? (
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      void handleSetPaymentStatus("failure");
                    }}
                    disabled={
                      paymentSubmitting ||
                      Date.now() >=
                        new Date(selectedPendingBooking.createdAt).getTime() +
                          BOOKING_PAYMENT_WINDOW_MS
                    }
                    className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {paymentSubmitting ? "Processing..." : "Fail Payment"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void handleSetPaymentStatus("success");
                    }}
                    disabled={
                      paymentSubmitting ||
                      Date.now() >=
                        new Date(selectedPendingBooking.createdAt).getTime() +
                          BOOKING_PAYMENT_WINDOW_MS
                    }
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {paymentSubmitting ? "Processing..." : "Complete Payment"}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPendingBooking(null);
                    setPaymentError(null);
                  }}
                  className="mt-6 w-full rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}
