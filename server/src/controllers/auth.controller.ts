import type { SessionHandler } from "@/middlewares/requireSession.middleware";
import { getSuccessResponse } from "@/utils/api-response";

export const getCurrentSession: SessionHandler = (_req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.json(getSuccessResponse(res.locals.session, "Authenticated"));
};
