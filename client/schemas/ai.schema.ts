import { z } from "zod"

const providerIdSchema = z.enum(["google", "openai", "xai", "anthropic"])

export const chatModelCatalogSchema = z.object({
  defaultProvider: providerIdSchema,
  providers: z
    .array(
      z.object({
        id: providerIdSchema,
        name: z.string(),
        available: z.boolean(),
        defaultModel: z.string(),
        models: z.array(z.object({ id: z.string(), name: z.string() })).min(1),
      })
    )
    .min(1),
})

export type ChatModelCatalog = z.infer<typeof chatModelCatalogSchema>
export type ChatModelSelection = {
  provider: ChatModelCatalog["defaultProvider"]
  model: string
  botId?: string
}
