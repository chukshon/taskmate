import { sql } from "drizzle-orm";

import { db, pool } from "@/db";

try {
  const result = await db.execute<{ connected: number }>(sql`SELECT 1 AS connected`);
  if (result.rows[0]?.connected !== 1) {
    throw new Error("Unexpected database response");
  }
  console.info("Database connection successful.");
} catch {
  console.error("Database connection failed. Check DATABASE_URL and network access.");
  process.exitCode = 1;
} finally {
  await pool.end();
}
