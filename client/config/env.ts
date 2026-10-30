import { z } from "zod"

const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z
    .url({ protocol: /^https?$/ })
    .transform((url) => url.replace(/\/$/, "")),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().startsWith("pk_"),
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: z.string().min(1),
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: z.string().min(1),
  NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL: z.string().min(1),
  NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL: z.string().min(1),
})

// Next.js requires explicit references to inline public variables in browser bundles.
const result = envSchema.safeParse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL,
  NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL:
    process.env.NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL,
  NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL:
    process.env.NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL,
})

if (!result.success) {
  throw new Error(
    `Invalid client environment configuration: ${result.error.issues.map((issue) => issue.path.join(".")).join(", ")}`
  )
}

export const env = result.data
