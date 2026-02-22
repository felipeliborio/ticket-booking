import { fetchEventAvailability } from "@/lib/events";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const availability = await fetchEventAvailability(id);
    return NextResponse.json(availability);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch event availability.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
