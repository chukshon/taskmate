import { getAuth } from "@clerk/express";
import type { Request, RequestHandler } from "express";
import { UnauthorizedException } from "@/utils/app-error";

export type SessionLocals = {
  session: { userId: string; sessionId: string };
};

export type SessionHandler = RequestHandler<
  Request["params"], unknown, unknown, Request["query"], SessionLocals
>;

export const requireSession: SessionHandler = (req, res, next) => {
  const auth = getAuth(req, { acceptsToken: "session_token" });
  if (!auth.isAuthenticated) {
    next(new UnauthorizedException("Sign in to continue."));
    return;
  }
  res.locals.session = { userId: auth.userId, sessionId: auth.sessionId };
  next();
};
