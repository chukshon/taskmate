import { auth } from "@clerk/nextjs/server"

import { UsageFeature } from "@/features/usage"

export default async function Page() {
  await auth.protect()

  return <UsageFeature />
}
