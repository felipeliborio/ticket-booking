import { MigrationBuilder } from "node-pg-migrate";

export const shorthands = undefined;

export function up(pgm: MigrationBuilder): void {
  pgm.createType("booking_status", ["pending", "success", "failure"]);

  pgm.createTable("booking", {
    id: {
      type: "bigserial",
      primaryKey: true,
    },
    external_id: {
      type: "uuid",
      notNull: true,
      unique: true,
    },
    event_id: {
      type: "int8",
      notNull: true,
      references: "event(id)",
      onDelete: "RESTRICT",
      onUpdate: "CASCADE",
    },
    vip_seats: {
      type: "int4",
      notNull: true,
    },
    first_row_seats: {
      type: "int4",
      notNull: true,
    },
    ga_seats: {
      type: "int4",
      notNull: true,
    },
    app_user_id: {
      type: "int8",
      notNull: true,
      references: "app_user(id)",
      onDelete: "RESTRICT",
      onUpdate: "CASCADE",
    },
    status: {
      type: "booking_status",
      notNull: true,
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

  pgm.createIndex("booking", ["status", "created_at"]);
}

export const down = false;
