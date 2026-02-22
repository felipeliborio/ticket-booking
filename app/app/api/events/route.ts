import { fetchEvents } from "@/lib/events";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit");
    const cursor = searchParams.get("cursor");
    const name = searchParams.get("name");

    const events = await fetchEvents({
      limit: limit ? Number.parseInt(limit, 10) : undefined,
      cursor: cursor ?? undefined,
      name: name ?? undefined,
    });
    return NextResponse.json(events);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch events.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
