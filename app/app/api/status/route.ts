import { fetchStatus } from "@/lib/status";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const status = await fetchStatus();
    return NextResponse.json(status);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch status.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
