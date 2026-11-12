import { Daytona, DaytonaNotFoundError } from "@daytona/sdk";
import { env } from "@/config/env.config";

const daytona = new Daytona({
  apiKey: env.DAYTONA_API_KEY,
  apiUrl: env.DAYTONA_API_URL,
});

export async function createBotSandbox(botId: string) {
  const sandbox = await daytona.create({ labels: { botId } });
  return sandbox.id;
}

export async function deleteBotSandbox(sandboxId: string | null | undefined) {
  if (!sandboxId) return;
  try {
    const sandbox = await daytona.get(sandboxId);
    await daytona.delete(sandbox);
  } catch (error) {
    if (error instanceof DaytonaNotFoundError) return;
    throw error;
  }
}

/** A running sandbox; idle ones stop themselves and are woken here. */
export async function getBotSandbox(sandboxId: string) {
  const sandbox = await daytona.get(sandboxId);
  if (sandbox.state !== "started") await sandbox.start();
  return sandbox;
}

const VNC_PORT = 6080;

/** Websocket URL for the bot's desktop preview (noVNC). */
export async function getBotDesktopUrl(sandboxId: string) {
  const sandbox = await getBotSandbox(sandboxId);
  const { status } = await sandbox.computerUse.getStatus();
  if (status !== "active") await sandbox.computerUse.start();

  const preview = await sandbox.getSignedPreviewUrl(VNC_PORT, 60 * 60);
  const url = new URL("/websockify", preview.url);
  url.protocol = "wss:";
  return url.toString();
}
