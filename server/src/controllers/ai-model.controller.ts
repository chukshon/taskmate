import type { SessionHandler } from "@/middlewares/requireSession.middleware";
import { getChatModels } from "@/services/ai-model.service";
import { getSuccessResponse } from "@/utils/api-response";

export const getChatModelsHandler: SessionHandler = (_req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.json(getSuccessResponse(getChatModels(), "Chat models retrieved."));
};
