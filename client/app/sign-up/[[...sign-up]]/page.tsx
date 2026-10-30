import { SignUp } from "@clerk/nextjs"
import { Suspense } from "react"

export default function SignUpPage() {
  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <Suspense>
        <SignUp fallbackRedirectUrl="/" signInUrl="/sign-in" />
      </Suspense>
    </main>
  )
}
