import { useMemo } from "react";
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

// Display names for tabs
const TAB_DISPLAY_NAMES: Record<string, string> = {
  needs_review: "needs your review",
  replied: "replied to you",
  reviewed: "already reviewed",
  team_reviewed: "team reviewed",
  review_requested: "other",
  closed: "merged",
};

/**
 * Extracts unique reason tabs from notifications with counts.
 * Tabs are renamed (review_requested -> other) and sorted by priority.
 */
export function useTabs(notifications: ParsedNotification[]) {
  return useMemo(() => {
    const byReason = Map.groupBy(notifications, (n) => n.reason);
    const tabMap = new Map<string, number>();

    // Group by display name (merging review_requested into "other")
    for (const [reason, reasonNotifications] of byReason) {
      const displayName = TAB_DISPLAY_NAMES[reason] ?? reason;
      const existing = tabMap.get(displayName) ?? 0;
      tabMap.set(displayName, existing + reasonNotifications!.length);
    }

    const tabs: Tab[] = [];
    for (const [reason, count] of tabMap) {
      tabs.push({ reason, count });
    }

    // Sort tabs by priority, then alphabetically
    tabs.sort((a, b) => {
      const orderA = TAB_ORDER[a.reason] ?? 100;
      const orderB = TAB_ORDER[b.reason] ?? 100;
      if (orderA !== orderB) return orderA - orderB;
      return a.reason.localeCompare(b.reason);
    });

    return tabs;
  }, [notifications]);
}

// Reverse lookup: display name -> original reasons
const TAB_ORIGINAL_REASONS: Record<string, string[]> = {
  "needs your review": ["needs_review"],
  "replied to you": ["replied"],
  "already reviewed": ["reviewed"],
  "team reviewed": ["team_reviewed"],
  other: ["review_requested", "other"],
  merged: ["merged", "closed"],
};

/**
 * Filters and sorts notifications for the selected tab.
 * All tabs sort by unread first, then apply tab-specific sorting.
 */
export function useFilteredNotifications(
  notifications: ParsedNotification[],
  selectedTab: string | null
) {
  return useMemo(() => {
    if (!selectedTab) return [];

    // Get original reasons that map to this tab
    const matchReasons = TAB_ORIGINAL_REASONS[selectedTab] ?? [selectedTab];
    const filtered = notifications.filter((n) => matchReasons.includes(n.reason));

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
      return b.updatedAt.getTime() - a.updatedAt.getTime();
    });
  }, [notifications, selectedTab]);
}

/**
 * Calculates which notifications should be visible based on viewport and selection.
 * Returns both the visible slice and the scroll offset for proper selection highlighting.
 */
export function useVisibleNotifications(
  notifications: ParsedNotification[],
  selectedIndex: number,
  terminalHeight: number
) {
  // Account for header (2 lines), repo name (1 line), tabs (1 line), footer (2 lines) = 6 lines
  // Each notification is now 2 lines tall
  const linesForChrome = 6;
  const linesPerItem = 2;
  const viewportHeight = Math.floor((terminalHeight - linesForChrome) / linesPerItem);

  return useMemo(() => {
    if (notifications.length === 0) return { visible: [], scrollOffset: 0 };

    const maxVisible = Math.max(1, viewportHeight);
    const halfVisible = Math.floor(maxVisible / 2);

    let scrollOffset = 0;
    if (selectedIndex > halfVisible) {
      scrollOffset = Math.min(
        selectedIndex - halfVisible,
        Math.max(0, notifications.length - maxVisible)
      );
    }

    return {
      visible: notifications.slice(scrollOffset, scrollOffset + maxVisible),
      scrollOffset,
    };
  }, [notifications, selectedIndex, viewportHeight]);
}
