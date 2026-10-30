import { BotsEmptyState } from "@/features/bots/bots-empty-state"

export function BotsFeature({ avatarSeed }: { avatarSeed: string }) {
  return (
    <main className="flex min-h-[calc(100svh-4rem)] p-6">
      <BotsEmptyState avatarSeed={avatarSeed} />
    </main>
  )
}
