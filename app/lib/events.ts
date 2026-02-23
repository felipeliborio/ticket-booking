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

export interface EventAvailability {
  id: string;
  availableTickets: {
    vip: number;
    firstRow: number;
    ga: number;
    total: number;
  };
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

export async function fetchEventById(id: string): Promise<EventItem> {
  const apiBaseUrl = getApiBaseUrl();
  const response = await fetch(`${apiBaseUrl}/events/${id}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Event request failed with ${response.status}.`);
  }

  return (await response.json()) as EventItem;
}

export async function fetchEventAvailability(
  id: string,
): Promise<EventAvailability> {
  const apiBaseUrl = getApiBaseUrl();
  const response = await fetch(`${apiBaseUrl}/events/${id}/availability`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Event availability request failed with ${response.status}.`,
    );
  }

  return (await response.json()) as EventAvailability;
}
