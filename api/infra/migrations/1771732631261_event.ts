import { MigrationBuilder } from "node-pg-migrate";

export const shorthands = undefined;

export function up(pgm: MigrationBuilder): void {
  pgm.createTable("event", {
    id: {
      type: "bigserial",
      primaryKey: true,
    },
    venue_id: {
      type: "int8",
      notNull: true,
      references: "venue(id)",
      onDelete: "RESTRICT",
      onUpdate: "CASCADE",
    },
    external_id: {
      type: "uuid",
      notNull: true,
      default: pgm.func("gen_random_uuid()"),
    },
    name: {
      type: "varchar(255)",
      notNull: true,
    },
    vip_price: {
      type: "numeric(10,4)",
      notNull: true,
    },
    first_row_price: {
      type: "numeric(10,4)",
      notNull: true,
    },
    ga_price: {
      type: "numeric(10,4)",
      notNull: true,
    },
    event_datetime: {
      type: "timestamptz",
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

  pgm.createIndex("event", "external_id");

  pgm.createIndex("event", ["event_datetime", "external_id"], {
    name: "event_event_datetime_external_id_idx",
  });
}

export const down = false;
