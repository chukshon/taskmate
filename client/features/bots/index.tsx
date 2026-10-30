import { BotsEmptyState } from "@/features/bots/bots-empty-state"

export function BotsFeature({ avatarSeed }: { avatarSeed: string }) {
  return (
    <div className="flex min-h-svh p-6">
      <BotsEmptyState avatarSeed={avatarSeed} />
    </div>
  )
}
