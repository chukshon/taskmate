import { createApp } from "./app.js";
import { env } from "@/config/env.config";
import { logger } from "@/utils/logger";

const server = createApp().listen(env.PORT, env.HOST, () => {
  logger.info("Taskmate API listening", { host: env.HOST, port: env.PORT });
});

server.on("error", (error) => {
  logger.error("Server failed to start", { errorType: error.name, message: error.message });
  process.exit(1);
});

let shuttingDown = false;

function shutdown(signal: NodeJS.Signals) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info("Shutting down", { signal });

  const timeout = setTimeout(() => {
    logger.error("Shutdown timed out");
    server.closeAllConnections();
    process.exit(1);
  }, 10_000);
  timeout.unref();

  server.close((error) => {
    clearTimeout(timeout);
    if (error) {
      logger.error("Shutdown failed", { errorType: error.name });
      process.exitCode = 1;
      return;
    }
    logger.info("Server stopped");
  });
}

const shutdownSignals: NodeJS.Signals[] = ["SIGTERM", "SIGINT"];
shutdownSignals.forEach((signal) => process.once(signal, () => shutdown(signal)));
