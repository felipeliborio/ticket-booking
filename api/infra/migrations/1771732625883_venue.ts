import { MigrationBuilder } from "node-pg-migrate";

export const shorthands = undefined;

export function up(pgm: MigrationBuilder): void {
  pgm.createExtension("pgcrypto", { ifNotExists: true });

  pgm.createTable("venue", {
    id: {
      type: "bigserial",
      primaryKey: true,
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

  pgm.createIndex("venue", "external_id");
}

export const down = false;
