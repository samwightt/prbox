import { homedir } from "os";
import { join } from "path";
import type { SeenData, SeenEntry } from "./notificationParser";

// Re-export for convenience
export type { SeenData, SeenEntry };

// Path to store seen notifications
const SEEN_FILE = join(homedir(), ".gh-notifications-seen.json");

export async function loadSeenNotifications(): Promise<SeenData> {
  try {
    const file = Bun.file(SEEN_FILE);
    if (await file.exists()) {
      return await file.json();
    }
  } catch {
    // File doesn't exist or is invalid
  }
  return { seen: {} };
}

export async function saveSeenNotifications(data: SeenData): Promise<void> {
  await Bun.write(SEEN_FILE, JSON.stringify(data, null, 2));
}
