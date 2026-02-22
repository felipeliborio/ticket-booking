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

export interface FindAllEventsOptions {
  name?: string;
  limit: number;
  cursor?: {
    eventDatetime: string;
    externalId: string;
  };
}
