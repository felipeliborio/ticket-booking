export interface EventDatabaseRow {
  external_id: string;
  venue_external_id: string;
  venue_name: string;
  name: string;
  vip_price: string;
  first_row_price: string;
  ga_price: string;
  event_datetime: Date;
  created_at: Date;
  updated_at: Date;
}

export interface EventAvailabilityRow {
  event_external_id: string;
  vip_available: number;
  first_row_available: number;
  ga_available: number;
  total_available: number;
}

export interface FindAllEventsOptions {
  name?: string;
  limit: number;
  cursor?: {
    eventDatetime: string;
    externalId: string;
  };
}
