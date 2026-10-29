import { Router } from "express";
import { authRoutes } from "@/routes/v1/auth.route";

export const routes = Router();
routes.use("/auth", authRoutes);
