import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const databaseUrl = process.env.DATABASE_URL_UNPOOLED;
if (!databaseUrl) {
  throw new Error("DATABASE_URL_UNPOOLED is required for Drizzle Kit.");
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  dialect: "postgresql",
  casing: "snake_case",
  dbCredentials: { url: databaseUrl },
});
