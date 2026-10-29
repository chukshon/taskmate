import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import helmet from "helmet";
import { env } from "@/config/env.config";
import { logger } from "@/utils/logger";
import { errorHandler, notFound } from "@/middlewares/errorHandler.middleware";
import { apiLimiter } from "@/middlewares/rateLimiter.middleware";
import { healthRouter } from "@/routes/health";
import { routes } from "@/routes/v1";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use((_req, res, next) => {
    const startedAt = performance.now();
    res.on("finish", () => {
      logger.info("Request completed", { statusCode: res.statusCode, durationMs: Math.round(performance.now() - startedAt) });
    });
    next();
  });
  app.use(helmet());
  app.use(cors({ origin: env.CLIENT_ORIGIN }));
  app.use(express.json({ limit: "100kb" }));
  app.use(express.urlencoded({ extended: true, limit: "100kb" }));
  app.use(cookieParser());
  app.use(healthRouter);
  app.use("/api/v1", apiLimiter, routes);
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
