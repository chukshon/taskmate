import { SignIn } from "@clerk/nextjs"
import { Suspense } from "react"

export default function SignInPage() {
  return (
    <main className="flex min-h-[calc(100svh-4rem)] items-center justify-center p-6">
      <Suspense>
        <SignIn fallbackRedirectUrl="/" signUpUrl="/sign-up" />
      </Suspense>
    </main>
  )
}
