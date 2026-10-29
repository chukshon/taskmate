"use client"

import { Show, UserButton } from "@clerk/nextjs"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"

export function AuthHeader() {
  return (
    <header className="flex h-16 items-center justify-between border-b px-6">
      <Link href="/" className="font-semibold">Taskmate</Link>
      <nav aria-label="Account" className="flex items-center gap-2">
        <Show when="signed-out">
          <Link href="/sign-in" className={buttonVariants({ variant: "ghost" })}>Sign in</Link>
          <Link href="/sign-up" className={buttonVariants()}>Create account</Link>
        </Show>
        <Show when="signed-in">
          <UserButton />
        </Show>
      </nav>
    </header>
  )
}
