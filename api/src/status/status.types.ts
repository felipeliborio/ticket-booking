export interface DatabaseStatus {
  openConnections: number;
  maxConnections: number;
  serverVersion: string;
}

export interface StatusResponse {
  updatedAt: string;
  dbStatus: DatabaseStatus;
}
