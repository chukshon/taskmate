import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { env } from "@/config/env.config";
import * as schema from "@/db/schema";
import { logger } from "@/utils/logger";

// One pool per Express process, shared by all requests.
export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  connectionTimeoutMillis: 10_000,
});

pool.on("error", (error) => {
  logger.error("Unexpected error on an idle database connection", { errorType: error.name });
});

export const db = drizzle({ client: pool, schema, casing: "snake_case" });
