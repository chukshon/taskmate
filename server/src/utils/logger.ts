import winston from "winston";
import { env } from "@/config/env.config";

const { combine, timestamp, json, colorize, printf } = winston.format;

export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  silent: env.NODE_ENV === "test",
  format: env.NODE_ENV === "production"
    ? combine(timestamp(), json())
    : combine(
        timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        colorize(),
        printf(({ timestamp: loggedAt, level, message, ...metadata }) => {
          const details = Object.keys(metadata).length ? ` ${JSON.stringify(metadata)}` : "";
          return `${String(loggedAt)} [${level}]: ${String(message)}${details}`;
        }),
      ),
  transports: [new winston.transports.Console()],
});
