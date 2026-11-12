export const aiProviderIds = ["google", "openai", "xai", "anthropic"] as const;
export type AIProviderId = typeof aiProviderIds[number];

type ProviderDefinition = {
  name: string;
  defaultModel: string;
  models: { id: string; name: string }[];
};

export const aiProviders: Record<AIProviderId, ProviderDefinition> = {
  google: {
    name: "Gemini",
    defaultModel: "gemini-3.5-flash-lite",
    models: [
      { id: "gemini-3.5-flash-lite", name: "Gemini 3.5 Flash-Lite" },
      { id: "gemini-3.8-flash", name: "Gemini 3.8 Flash" },
    ],
  },
  openai: {
    name: "OpenAI",
    defaultModel: "gpt-6.1-terra",
    models: [
      { id: "gpt-6.1-terra", name: "GPT-6.1 Terra" },
      { id: "gpt-6.1-sol", name: "GPT-6.1 Sol" },
    ],
  },
  xai: {
    name: "xAI",
    defaultModel: "grok-4.7",
    models: [{ id: "grok-4.7", name: "Grok 4.7" }],
  },
  anthropic: {
    name: "Anthropic",
    defaultModel: "claude-haiku-5-5",
    models: [
      { id: "claude-haiku-5-5", name: "Claude Haiku 5.5" },
      { id: "claude-sonnet-5-5", name: "Claude Sonnet 5.5" },
    ],
  },
};

export const defaultAIProvider: AIProviderId = "google";

export function isSupportedModel(provider: AIProviderId, model: string) {
  return model === "auto" || aiProviders[provider].models.some(({ id }) => id === model);
}
