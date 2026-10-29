import { Router } from "express";
import { getCurrentSession } from "@/controllers/auth.controller";
import { requireSession } from "@/middlewares/requireSession.middleware";

export const authRoutes = Router();
authRoutes.get("/me", requireSession, getCurrentSession);
