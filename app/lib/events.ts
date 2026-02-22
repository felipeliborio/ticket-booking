export interface EventVenue {
  id: string;
  name: string;
}

export interface EventItem {
  id: string;
  venue: EventVenue;
  name: string;
  vipPrice: number;
  firstRowPrice: number;
  gaPrice: number;
  eventDatetime: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListEventsResponse {
  events: EventItem[];
  limit: number;
  found: number;
  hasMore: boolean;
  nextCursor: string | null;
}

export interface FetchEventsOptions {
  limit?: number;
  cursor?: string;
  name?: string;
}

function getApiBaseUrl() {
  const apiBaseUrl = process.env.API_BASE_URL;

  if (!apiBaseUrl) {
    throw new Error("Missing API_BASE_URL environment variable.");
  }

  return apiBaseUrl;
}

export async function fetchEvents(
  options: FetchEventsOptions = {},
): Promise<ListEventsResponse> {
  const apiBaseUrl = getApiBaseUrl();
  const params = new URLSearchParams();

  if (options.limit) {
    params.set("limit", String(options.limit));
  }

  if (options.cursor) {
    params.set("cursor", options.cursor);
  }

  if (options.name) {
    params.set("name", options.name);
  }

  const queryString = params.toString();
  const url = `${apiBaseUrl}/events${queryString ? `?${queryString}` : ""}`;

  const response = await fetch(url, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Events request failed with ${response.status}.`);
  }

  return (await response.json()) as ListEventsResponse;
}
