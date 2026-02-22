import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

export function loadEnvironment(): void {
  const candidateFiles = [".env.development", ".env.local", ".env"];
  const envFile = candidateFiles.find((file) =>
    existsSync(resolve(process.cwd(), file)),
  );

  const envConfig = dotenv.config(envFile ? { path: envFile } : undefined);
  dotenvExpand.expand(envConfig);
}
