import { auth } from "@clerk/nextjs/server"
import { ApiSessionCheck } from "@/components/api-session-check"

export default async function Page() {
  await auth.protect()

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-6 py-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Welcome to Taskmate</h1>
        <p className="text-muted-foreground">You&apos;re signed in. Your workspace is ready for the next stage.</p>
      </div>
      <ApiSessionCheck />
    </main>
  )
}
