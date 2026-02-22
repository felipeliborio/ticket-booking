export interface PaymentRow {
  booking_external_id: string;
  payment_status: "pending" | "success" | "failure";
  booking_status: "pending" | "success" | "failure";
  updated_at: Date;
}
