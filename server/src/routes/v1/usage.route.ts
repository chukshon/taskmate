import { Router } from "express";
import { getUsageHandler } from "@/controllers/usage.controller";
import { requireSession } from "@/middlewares/requireSession.middleware";

export const usageRoutes = Router();
usageRoutes.get("/", requireSession, getUsageHandler());
