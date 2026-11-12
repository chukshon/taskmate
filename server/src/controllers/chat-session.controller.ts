import type { Request, RequestHandler } from "express";
import type { SessionLocals } from "@/middlewares/requireSession.middleware";
import type { ValidatedLocals } from "@/middlewares/validateRequest.middleware";
import type {
  loadChatTranscriptRequest,
  mintChatAccessTokenRequest,
  startChatSessionRequest,
} from "@/validators/chat-session.validator";
import {
  loadChatTranscript,
  mintChatAccessToken,
  startChatSession,
} from "@/services/chat-session.service";
import { getSuccessResponse } from "@/utils/api-response";

type StartChatSessionHandler = RequestHandler<
  Request["params"],
  unknown,
  unknown,
  Request["query"],
  SessionLocals & ValidatedLocals<typeof startChatSessionRequest>
>;

type MintChatAccessTokenHandler = RequestHandler<
  Request["params"],
  unknown,
  unknown,
  Request["query"],
  SessionLocals & ValidatedLocals<typeof mintChatAccessTokenRequest>
>;

type LoadChatTranscriptHandler = RequestHandler<
  Request["params"],
  unknown,
  unknown,
  Request["query"],
  SessionLocals & ValidatedLocals<typeof loadChatTranscriptRequest>
>;

export function startChatSessionHandler(
  beginSession = startChatSession,
): StartChatSessionHandler {
  return async (_req, res) => {
    const { params, body } = res.locals.validated;
    const session = await beginSession(res.locals.session.userId, {
      chatId: params.chatId,
      clientData: body.clientData,
    });
    res.setHeader("Cache-Control", "no-store");
    res.json(getSuccessResponse(session, "Chat session started."));
  };
}

export function mintChatAccessTokenHandler(
  mintToken = mintChatAccessToken,
): MintChatAccessTokenHandler {
  return async (_req, res) => {
    const { params } = res.locals.validated;
    const token = await mintToken(
      res.locals.session.userId,
      params.chatId,
    );
    res.setHeader("Cache-Control", "no-store");
    res.json(getSuccessResponse(token, "Chat access token minted."));
  };
}

export function loadChatTranscriptHandler(
  loadTranscript = loadChatTranscript,
): LoadChatTranscriptHandler {
  return async (_req, res) => {
    const { params, query } = res.locals.validated;
    const transcript = await loadTranscript(res.locals.session.userId, {
      chatId: params.chatId,
      limit: query.limit,
      before: query.before,
    });
    res.setHeader("Cache-Control", "no-store");
    res.json(getSuccessResponse(transcript, "Chat transcript retrieved."));
  };
}
