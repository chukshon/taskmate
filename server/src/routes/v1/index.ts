import { Router } from "express";
import { authRoutes } from "@/routes/v1/auth.route";
import { botRoutes } from "@/routes/v1/bot.route";
import { chatRoutes } from "@/routes/v1/chat.route";

export const routes = Router();
routes.use("/auth", authRoutes);
routes.use("/bots", botRoutes);
routes.use("/chats", chatRoutes);
