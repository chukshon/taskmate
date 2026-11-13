import type { SessionHandler } from "@/middlewares/requireSession.middleware";
import { getUsage, usageLimits } from "@/services/usage.service";
import { getSuccessResponse } from "@/utils/api-response";

export function getUsageHandler(): SessionHandler {
  return async (_req, res) => {
    const usage = await getUsage(res.locals.session.userId);
    res.setHeader("Cache-Control", "no-store");
    res.json(
      getSuccessResponse(
        usage
          ? {
              period: {
                start: usage.period.start.toISOString(),
                end: usage.period.end.toISOString(),
              },
              used: usage.used,
              remaining: usage.remaining,
              limits: usageLimits,
            }
          : null,
        "Usage retrieved.",
      ),
    );
  };
}
