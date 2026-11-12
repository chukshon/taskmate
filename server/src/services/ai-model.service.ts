import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { createXai } from "@ai-sdk/xai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { aiProviderIds, aiProviders, defaultAIProvider, isSupportedModel } from "@/config/ai.config";
import type { AIProviderId } from "@/config/ai.config";
import { env } from "@/config/env.config";
import { BadRequestException } from "@/utils/app-error";

export type ChatModelSelection = { provider: AIProviderId; model: string };

function getProviderKey(provider: AIProviderId) {
  const keys = {
    google: env.GOOGLE_GENERATIVE_AI_API_KEY,
    openai: env.OPENAI_API_KEY,
    xai: env.XAI_API_KEY,
    anthropic: env.ANTHROPIC_API_KEY,
  };
  return keys[provider];
}

export function getChatModels() {
  const providers = aiProviderIds.map((id) => ({
    id,
    ...aiProviders[id],
    available: Boolean(getProviderKey(id)),
  }));
  const preferred = providers.find(
    ({ id, available }) => id === defaultAIProvider && available,
  );
  const fallback = providers.find(({ available }) => available);

  return {
    defaultProvider: preferred?.id ?? fallback?.id ?? defaultAIProvider,
    providers,
  };
}

export function createChatModel({ provider, model }: ChatModelSelection) {
  if (!isSupportedModel(provider, model)) throw new BadRequestException("Choose a supported model for this provider.");
  const apiKey = getProviderKey(provider);
  if (!apiKey) throw new BadRequestException(`${aiProviders[provider].name} is not configured on the server.`);
  const modelId = model === "auto" ? aiProviders[provider].defaultModel : model;
  switch (provider) {
    case "google": return createGoogleGenerativeAI({ apiKey })(modelId);
    case "openai": return createOpenAI({ apiKey })(modelId);
    case "xai": return createXai({ apiKey })(modelId);
    case "anthropic": return createAnthropic({ apiKey })(modelId);
  }
}
