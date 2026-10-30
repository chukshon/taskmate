import { ClerkProvider } from "@clerk/nextjs"
import { shadcn } from "@clerk/ui/themes"

import { Toaster } from "@/components/ui/toast"
import { TooltipProvider } from "@/components/ui/tooltip"
import { env } from "@/config/env"
import { QueryProvider } from "@/providers/query-provider"
import { ThemeProvider } from "@/providers/theme-provider"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      publishableKey={env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      signInUrl={env.NEXT_PUBLIC_CLERK_SIGN_IN_URL}
      signUpUrl={env.NEXT_PUBLIC_CLERK_SIGN_UP_URL}
      signInFallbackRedirectUrl={
        env.NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL
      }
      signUpFallbackRedirectUrl={
        env.NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL
      }
      appearance={{ theme: shadcn }}
    >
      <ThemeProvider>
        <QueryProvider>
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster />
        </QueryProvider>
      </ThemeProvider>
    </ClerkProvider>
  )
}
