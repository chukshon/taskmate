import { Daytona, DaytonaNotFoundError, type Sandbox } from "@daytona/sdk";
import { env } from "@/config/env.config";

const daytona = new Daytona({
  apiKey: env.DAYTONA_API_KEY,
  apiUrl: env.DAYTONA_API_URL,
});

// A bot's notes to itself, in its sandbox's home directory. Chats don't share
// their transcripts, so this is what a bot carries from one chat to another.
export const MEMORY_FILE = "MEMORY.md";

export async function createBotSandbox(botId: string) {
  const sandbox = await daytona.create({ labels: { botId } });

  try {
    // Blank until the bot has something worth keeping. A command rather than
    // an upload: the SDK's uploads can fail under some bundlers. Commands start
    // in the home directory.
    const { exitCode, result } = await sandbox.process.executeCommand(
      `touch ${MEMORY_FILE}`,
    );
    if (exitCode !== 0) {
      throw new Error(`Creating ${MEMORY_FILE} failed: ${result}`);
    }
  } catch (error) {
    // A sandbox nobody got the ID of would never be deleted
    await daytona.delete(sandbox).catch(() => {});
    throw error;
  }

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

/** Everything a bot has saved to its memory. Creates the file if missing. */
export async function readBotMemory(sandbox: Sandbox) {
  const { exitCode, result } = await sandbox.process.executeCommand(
    `touch ${MEMORY_FILE} && cat ${MEMORY_FILE}`,
  );
  if (exitCode !== 0) {
    throw new Error(`Reading ${MEMORY_FILE} failed: ${result}`);
  }
  return result;
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
