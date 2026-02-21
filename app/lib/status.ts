export interface DatabaseStatus {
  openConnections: number;
  maxConnections: number;
  serverVersion: string;
}

export interface StatusResponse {
  updatedAt: string;
  dbStatus: DatabaseStatus;
}

function getApiBaseUrl() {
  const apiBaseUrl = process.env.API_BASE_URL;

  if (!apiBaseUrl) {
    throw new Error("Missing API_BASE_URL environment variable.");
  }

  return apiBaseUrl;
}

export async function fetchStatus(): Promise<StatusResponse> {
  const apiBaseUrl = getApiBaseUrl();
  const response = await fetch(`${apiBaseUrl}/status`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Status request failed with ${response.status}.`);
  }

  return (await response.json()) as StatusResponse;
}
