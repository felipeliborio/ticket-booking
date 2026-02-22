import { MigrationBuilder } from "node-pg-migrate";

export const shorthands = undefined;

export function up(pgm: MigrationBuilder): void {
  pgm.createTable("app_user", {
    id: {
      type: "bigserial",
      primaryKey: true,
    },
    external_id: {
      type: "uuid",
      notNull: true,
      unique: true,
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
}

export const down = false;
