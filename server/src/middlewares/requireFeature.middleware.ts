import { getAuth } from "@clerk/express";
import type { Request } from "express";
import {
  UPGRADE_REQUIRED_MESSAGE,
  type Feature,
} from "@/lib/billing";
import { ForbiddenException, UnauthorizedException } from "@/utils/app-error";
import type { SessionHandler } from "@/middlewares/requireSession.middleware";

/** After requireSession: deny when the Clerk plan is missing any listed feature. */
export function requireFeature(...features: Feature[]): SessionHandler {
  return (req: Request, _res, next) => {
    const auth = getAuth(req, { acceptsToken: "session_token" });
    if (!auth.isAuthenticated) {
      next(new UnauthorizedException("Sign in to continue."));
      return;
    }

    for (const feature of features) {
      if (!auth.has({ feature })) {
        next(new ForbiddenException(UPGRADE_REQUIRED_MESSAGE));
        return;
      }
    }

    next();
  };
}
