import { auth } from "@clerk/nextjs/server"

import { BotsFeature } from "@/features/bots"

export default async function Page() {
  await auth.protect()

  return <BotsFeature avatarSeed={crypto.randomUUID()} />
}
