import { createListenerMiddleware } from "@reduxjs/toolkit";
import { notificationsApi } from "./notificationsApi";
import { loadSeenNotifications, saveSeenNotifications } from "./seenStorage";

export const seenNotificationsListener = createListenerMiddleware();

// Listen for successful notification fetches - update seen timestamps
seenNotificationsListener.startListening({
  matcher: notificationsApi.endpoints.getNotifications.matchFulfilled,
  effect: async (action) => {
    const notifications = action.payload;
    const seenData = await loadSeenNotifications();
    const now = new Date().toISOString();

    for (const n of notifications) {
      const existing = seenData.seen[n.id];
      if (existing) {
        existing.lastSeen = now;
      } else {
        seenData.seen[n.id] = {
          firstSeen: now,
          lastSeen: now,
          prNumber: n.prNumber,
          repo: n.repo,
          title: n.cleanTitle,
        };
      }
    }

    await saveSeenNotifications(seenData);
  },
});

// Listen for mark as done - record done timestamp in history
seenNotificationsListener.startListening({
  matcher: notificationsApi.endpoints.markAsDone.matchFulfilled,
  effect: async (action) => {
    const { id } = action.meta.arg.originalArgs;
    const seenData = await loadSeenNotifications();
    const now = new Date().toISOString();

    if (seenData.seen[id]) {
      seenData.seen[id].doneHistory = [...(seenData.seen[id].doneHistory ?? []), now];
    } else {
      // Create entry if it doesn't exist
      seenData.seen[id] = {
        firstSeen: now,
        lastSeen: now,
        prNumber: 0,
        repo: "",
        title: "",
        doneHistory: [now],
      };
    }

    await saveSeenNotifications(seenData);
  },
});

// Listen for unsubscribe - mark as unsubscribed
seenNotificationsListener.startListening({
  matcher: notificationsApi.endpoints.unsubscribe.matchFulfilled,
  effect: async (action) => {
    const { id } = action.meta.arg.originalArgs;
    const seenData = await loadSeenNotifications();
    const now = new Date().toISOString();

    if (seenData.seen[id]) {
      seenData.seen[id].unsubscribed = true;
    } else {
      // Create entry if it doesn't exist
      seenData.seen[id] = {
        firstSeen: now,
        lastSeen: now,
        prNumber: 0,
        repo: "",
        title: "",
        unsubscribed: true,
      };
    }

    await saveSeenNotifications(seenData);
  },
});
