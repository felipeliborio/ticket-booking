export interface BookingInsertRow {
  external_id: string;
  status: "pending" | "success" | "failure";
  vip_seats: number;
  first_row_seats: number;
  ga_seats: number;
  created_at: Date;
  updated_at: Date;
}
