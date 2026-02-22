import { Injectable } from "@nestjs/common";
import { database } from "infra/database";
import { AppUserIdRow } from "src/app-user/app-user.types";

@Injectable()
export class AppUserRepository {
  async upsertAndGetInternalId(
    externalId: string,
  ): Promise<number | undefined> {
    const queryResult = await database.query<AppUserIdRow>({
      text: `
        WITH inserted AS (
          INSERT INTO app_user (external_id)
          VALUES ($1)
          ON CONFLICT (external_id) DO NOTHING
          RETURNING id::text
        )
        SELECT id
        FROM inserted
        UNION ALL
        SELECT id::text
        FROM app_user
        WHERE external_id = $1
        LIMIT 1;
      `,
      values: [externalId],
    });

    const row = queryResult.rows[0];
    return row ? Number.parseInt(row.id, 10) : undefined;
  }
}
