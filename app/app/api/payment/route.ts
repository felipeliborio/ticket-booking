import { NextResponse } from "next/server";

function getApiBaseUrl(): string {
  const apiBaseUrl = process.env.API_BASE_URL;

  if (!apiBaseUrl) {
    throw new Error("Missing API_BASE_URL environment variable.");
  }

  return apiBaseUrl;
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const apiBaseUrl = getApiBaseUrl();

    const response = await fetch(`${apiBaseUrl}/payment`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const responsePayload = (await response.json().catch(() => null)) as
      | object
      | null;

    return NextResponse.json(responsePayload, { status: response.status });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to process payment.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
