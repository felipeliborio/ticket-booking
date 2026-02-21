import { Injectable } from "@nestjs/common";
import { database } from "infra/database";
import { DatabaseStatus } from "src/status/status.types";

@Injectable()
export class StatusRepository {
  async findDatabaseStatus(): Promise<DatabaseStatus> {
    const queryResult = await database.query<DatabaseStatus>({
      text: `
        SELECT
          (SELECT COUNT(*)::int FROM pg_stat_activity) AS "openConnections",
          (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') AS "maxConnections",
          current_setting('server_version') AS "serverVersion";
      `,
    });

    return queryResult.rows[0];
  }
}
