"use client";

import type { StatusResponse } from "@/lib/status";
import { useEffect, useState } from "react";

async function getStatus(): Promise<StatusResponse> {
  const response = await fetch("/api/status", { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Status request failed with ${response.status}.`);
  }

  return (await response.json()) as StatusResponse;
}

export default function StatusPage() {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadStatus = async () => {
      try {
        const nextStatus = await getStatus();
        if (!isMounted) return;
        setStatus(nextStatus);
        setError(null);
      } catch (loadError) {
        if (!isMounted) return;
        const message =
          loadError instanceof Error
            ? loadError.message
            : "Failed to fetch status.";
        setError(message);
      }
    };

    void loadStatus();
    const intervalId = setInterval(() => {
      void loadStatus();
    }, 1000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-r from-blue-50 via-white to-red-50 px-6">
      <section className="w-full max-w-2xl rounded-3xl border border-white/70 bg-white/80 p-10 shadow-xl backdrop-blur">
        <header className="mb-8 space-y-2 text-center">
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-700">
            System Status
          </h1>
          <p className="text-sm text-zinc-800">
            Live backend and database health.
          </p>
        </header>

        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-zinc-700">Updated At</dt>
            <dd className="text-lg font-medium text-zinc-600">
              {status?.updatedAt ?? "--"}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-zinc-700">Server Version</dt>
            <dd className="text-lg font-medium text-zinc-600">
              {status?.dbStatus.serverVersion ?? "--"}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-zinc-700">Open Connections</dt>
            <dd className="text-lg font-medium text-zinc-600">
              {status?.dbStatus.openConnections ?? "--"}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-zinc-700">Max Connections</dt>
            <dd className="text-lg font-medium text-zinc-600">
              {status?.dbStatus.maxConnections ?? "--"}
            </dd>
          </div>
        </dl>
        {error ? (
          <p className="mt-6 text-center text-sm text-red-600">{error}</p>
        ) : null}
      </section>
    </main>
  );
}
