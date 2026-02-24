export interface BookingInsertRow {
  external_id: string;
  status: "pending" | "success" | "failure";
  vip_seats: number;
  first_row_seats: number;
  ga_seats: number;
  created_at: Date;
  updated_at: Date;
}

export interface BookingInsertAttemptRow {
  event_exists: boolean;
  app_user_exists: boolean;
  external_id: string | null;
  status: "pending" | "success" | "failure" | null;
  vip_seats: number | null;
  first_row_seats: number | null;
  ga_seats: number | null;
  created_at: Date | null;
  updated_at: Date | null;
}

export interface BookingListRow extends BookingInsertRow {
  event_external_id: string;
  event_name: string;
  event_datetime: Date;
  venue_name: string;
  total_cost: string | number;
}
