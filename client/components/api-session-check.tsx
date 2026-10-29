"use client"

import { useAuth } from "@clerk/nextjs"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { getApiSession } from "@/lib/api"

export function ApiSessionCheck() {
  const { getToken, isLoaded, isSignedIn } = useAuth()
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState("Check that your account is authenticated with the API.")

  async function checkSession() {
    setPending(true)
    setMessage("Checking your API session…")
    try {
      const token = await getToken()
      if (!token) throw new Error("Please sign in again.")
      await getApiSession(token)
      setMessage("Connected. The API verified your Clerk session.")
    } catch (error) {
      setMessage(error instanceof TypeError
        ? "Could not reach the API. Make sure the server is running."
        : error instanceof Error ? error.message : "Could not verify your API session.")
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex flex-col items-start gap-3">
      <Button onClick={checkSession} disabled={!isLoaded || !isSignedIn || pending}>
        {pending && <Spinner data-icon="inline-start" />}
        Check API connection
      </Button>
      <p role="status" className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}
