import { MigrationBuilder } from "node-pg-migrate";

export const shorthands = undefined;

export function up(pgm: MigrationBuilder): void {
  pgm.createType("payment_status", ["pending", "success", "failure"]);

  pgm.createTable("payment", {
    booking_id: {
      type: "int8",
      primaryKey: true,
      references: "booking(id)",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    status: {
      type: "payment_status",
      notNull: true,
      default: "pending",
    },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
    updated_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });

  pgm.sql(`
    CREATE OR REPLACE FUNCTION payment_sync_booking_status()
    RETURNS TRIGGER AS $$
    BEGIN
      UPDATE booking
      SET
        status = NEW.status::text::booking_status,
        updated_at = now()
      WHERE id = NEW.booking_id;

      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  pgm.sql(`
    CREATE TRIGGER payment_sync_booking_status_trigger
    AFTER UPDATE OF status ON payment
    FOR EACH ROW
    WHEN (NEW.status IN ('success', 'failure') AND OLD.status <> NEW.status)
    EXECUTE FUNCTION payment_sync_booking_status();
  `);
}

export const down = false;
