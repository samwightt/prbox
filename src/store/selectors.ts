import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "./index";
import { notificationsApi } from "./api/notificationsApi";
import type { ParsedNotification } from "../types";

export interface Tab {
  reason: string;
  count: number;
}

// Tab order priority (lower = first) - uses display names
const TAB_ORDER: Record<string, number> = {
  "needs your review": 0,
  "replied to you": 1,
  "already reviewed": 2,
  "team reviewed": 3,
  mention: 4,
  comment: 5,
  merged: 6,
  draft: 7,
  other: 8,
  // All others get default priority of 100
};

// Display names for tabs (maps reason -> display tab name)
const TAB_DISPLAY_NAMES: Record<string, string> = {
  needs_review: "needs your review",
  replied: "replied to you",
  reviewed: "already reviewed",
  team_reviewed: "team reviewed",
  review_requested: "other",
  closed: "merged",
};

/**
 * Get the display tab name for a notification reason.
 */
function getDisplayTab(reason: string): string {
  return TAB_DISPLAY_NAMES[reason] ?? reason;
}

/**
 * Notification with computed display tab attached.
 */
export type NotificationWithTab = ParsedNotification & { displayTab: string };

/**
 * Select notifications from RTK Query cache.
 */
const selectNotificationsResult = notificationsApi.endpoints.getNotifications.select();

const selectRawNotifications = createSelector(
  selectNotificationsResult,
  (result): ParsedNotification[] => result.data ?? []
);

/**
 * Select notifications with their display tab attached.
 */
export const selectNotifications = createSelector(
  selectRawNotifications,
  (notifications): NotificationWithTab[] =>
    notifications.map((n) => ({ ...n, displayTab: getDisplayTab(n.reason) }))
);

export const selectNotificationsLoading = createSelector(
  selectNotificationsResult,
  (result) => result.isLoading
);

export const selectNotificationsRefreshing = createSelector(
  selectNotificationsResult,
  (result) => result.status === "pending" || (result as { isFetching?: boolean }).isFetching === true
);

export const selectNotificationsError = createSelector(
  selectNotificationsResult,
  (result) => result.error ? (result.error as { message?: string }).message ?? String(result.error) : null
);

/**
 * Select tabs from notifications.
 * Groups by displayTab and sorts by priority.
 */
export const selectTabs = createSelector(
  selectNotifications,
  (notifications): Tab[] => {
    const byTab = Map.groupBy(notifications, (n) => n.displayTab);
    const tabs: Tab[] = [];

    for (const [tab, tabNotifications] of byTab) {
      tabs.push({ reason: tab, count: tabNotifications!.length });
    }

    // Sort tabs by priority, then alphabetically
    tabs.sort((a, b) => {
      const orderA = TAB_ORDER[a.reason] ?? 100;
      const orderB = TAB_ORDER[b.reason] ?? 100;
      if (orderA !== orderB) return orderA - orderB;
      return a.reason.localeCompare(b.reason);
    });

    return tabs;
  }
);

/**
 * Select the tab count.
 */
export const selectTabCount = createSelector(
  selectTabs,
  (tabs) => tabs.length || 1
);

/**
 * Select the currently selected tab.
 * If the selected index is out of bounds, uses the closest previous valid index.
 */
export const selectSelectedTab = createSelector(
  selectTabs,
  (state: RootState) => state.ui.selectedTabIndex,
  (tabs, selectedTabIndex): string | null => {
    if (tabs.length === 0) return null;
    const clampedIndex = Math.min(selectedTabIndex, tabs.length - 1);
    return tabs[clampedIndex]?.reason ?? null;
  }
);

/**
 * Select filtered notifications for the selected tab.
 * All tabs sort by unread first, then apply tab-specific sorting.
 */
export const selectFilteredNotifications = createSelector(
  selectNotifications,
  selectSelectedTab,
  (notifications, selectedTab): NotificationWithTab[] => {
    if (!selectedTab) return [];

    // Simple filter by displayTab
    const filtered = notifications.filter((n) => n.displayTab === selectedTab);

    return filtered.sort((a, b) => {
      // ALL tabs: sort by unread first
      if (a.unread !== b.unread) {
        return a.unread ? -1 : 1;
      }

      // Tab-specific sorting
      if (selectedTab === "already reviewed") {
        // Sort by user reviewed vs teammate reviewed (user first)
        const aUserReviewed = !a.teamReviewedBy;
        const bUserReviewed = !b.teamReviewedBy;
        if (aUserReviewed !== bUserReviewed) {
          return aUserReviewed ? -1 : 1;
        }
      } else if (selectedTab === "needs your review") {
        // Sort by reviewing team (group by team, nulls last)
        const teamA = a.reviewRequestedFrom ?? "";
        const teamB = b.reviewRequestedFrom ?? "";
        if (teamA !== teamB) {
          if (teamA && teamB) return teamA.localeCompare(teamB);
          return teamA ? -1 : 1;
        }
      } else if (selectedTab === "merged") {
        // Sort closed before merged
        if (a.isClosed !== b.isClosed) {
          return a.isClosed ? -1 : 1;
        }
      }

      // Finally sort by date (newest first)
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }
);

/**
 * Select the list length of filtered notifications.
 */
export const selectFilteredNotificationsLength = createSelector(
  selectFilteredNotifications,
  (notifications) => notifications.length
);

/**
 * Select the currently selected notification.
 * If the selected index is out of bounds, uses the closest previous valid index.
 */
export const selectSelectedNotification = createSelector(
  selectFilteredNotifications,
  (state: RootState) => state.ui.selectedIndex,
  (notifications, selectedIndex): NotificationWithTab | null => {
    if (notifications.length === 0) return null;
    const clampedIndex = Math.min(selectedIndex, notifications.length - 1);
    return notifications[clampedIndex] ?? null;
  }
);

/**
 * Select whether escape was pressed (for "press again to quit" UI hint).
 */
export const selectEscapePressed = createSelector(
  (state: RootState) => state.ui.keyBuffer,
  (keyBuffer) => keyBuffer[keyBuffer.length - 1]?.key.escape ?? false
);

/**
 * Select whether 'g' was pressed (for "gg" motion UI hint).
 */
export const selectGPressed = createSelector(
  (state: RootState) => state.ui.keyBuffer,
  (keyBuffer) => keyBuffer[keyBuffer.length - 1]?.input === "g"
);
