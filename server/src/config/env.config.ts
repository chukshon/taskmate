import "dotenv/config";
import { z } from "zod";

const optionalAPIKey = z.preprocess(
  (value) => typeof value === "string" && !value.trim() ? undefined : value,
  z.string().trim().min(1).optional(),
);

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  HOST: z.string().min(1).default("0.0.0.0"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  CLIENT_ORIGIN: z.url().default("http://localhost:3000"),
  LOG_LEVEL: z.enum(["error", "warn", "info", "http", "verbose", "debug", "silly"]).default("info"),
  CLERK_PUBLISHABLE_KEY: z.string().startsWith("pk_"),
  CLERK_SECRET_KEY: z.string().startsWith("sk_"),
  CLERK_JWT_KEY: z.string().min(1).optional(),
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  OPENAI_API_KEY: optionalAPIKey,
  GOOGLE_GENERATIVE_AI_API_KEY: optionalAPIKey,
  XAI_API_KEY: optionalAPIKey,
  ANTHROPIC_API_KEY: optionalAPIKey,
  TRIGGER_SECRET_KEY: optionalAPIKey,
});

const result = envSchema.safeParse({
  ...process.env,
  // Clerk's Next.js accountless env pull retains this public-key name.
  CLERK_PUBLISHABLE_KEY: process.env.CLERK_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
});

if (!result.success) {
  // Report invalid variable names without printing their values.
  throw new Error(`Invalid environment configuration: ${result.error.issues.map((issue) => issue.path.join(".")).join(", ")}`);
}

export const env = result.data;
