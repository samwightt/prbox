import { useEffect } from "react";
import { useInput } from "ink";
import { store } from "../store";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  moveSelectionUp,
  moveSelectionDown,
  setTabCount,
  setEscapePressed,
  setExiting,
  setShowHelp,
  setGPressed,
  adjustSelectionAfterRemoval,
  createNavigationAction,
} from "../store/uiSlice";
import type { ParsedNotification } from "../types";

interface UseKeyboardNavOptions {
  tabCount: number;
  filteredNotifications: ParsedNotification[];
  onMarkRead: (id: string) => void;
  onMarkUnread: (id: string) => void;
  onMarkDone: (id: string) => void;
  onUnsubscribe: (id: string) => void;
  onRefresh: () => void;
}

/**
 * Manages keyboard navigation via Redux.
 * Uses store.getState() in useInput callback to bypass stale closure issues.
 */
export function useKeyboardNav({
  tabCount,
  filteredNotifications,
  onMarkRead,
  onMarkUnread,
  onMarkDone,
  onUnsubscribe,
  onRefresh,
}: UseKeyboardNavOptions) {
  const dispatch = useAppDispatch();

  // Read from Redux for component render
  const { selectedIndex, selectedTabIndex, escapePressed, gPressed, exiting, showHelp } =
    useAppSelector((state) => state.ui);

  // Sync tabCount to store when it changes
  useEffect(() => {
    dispatch(setTabCount(tabCount));
  }, [tabCount, dispatch]);

  useInput((input, key) => {
    // Use store.getState() to get FRESH state - bypasses React's closure problem!
    const state = store.getState().ui;

    if (state.exiting) return;

    // Check if this is a navigation key
    const navigationAction = createNavigationAction(
      input,
      { tab: key.tab, shift: key.shift },
      filteredNotifications.length
    );

    if (navigationAction) {
      // Navigation key - but if help is showing and it's not "?", just dismiss help
      if (state.showHelp && input !== "?") {
        dispatch(setShowHelp(false));
        return;
      }
      dispatch(navigationAction);
      return;
    }

    // Dismiss help on any other key
    if (state.showHelp) {
      dispatch(setShowHelp(false));
      return;
    }

    // Escape handling (has side effect: process.exit)
    if (key.escape) {
      if (state.escapePressed) {
        dispatch(setExiting(true));
        setTimeout(() => process.exit(0), 50);
      } else {
        dispatch(setEscapePressed(true));
        dispatch(setGPressed(false));
      }
      return;
    }

    // Reset escape on any other key
    if (state.escapePressed) {
      dispatch(setEscapePressed(false));
    }

    // Reset g on any other key (navigation keys handle their own g reset)
    if (state.gPressed) {
      dispatch(setGPressed(false));
    }

    // Quit (has side effect: process.exit)
    if (input === "q") {
      dispatch(setExiting(true));
      setTimeout(() => process.exit(0), 50);
      return;
    }

    // Selection navigation
    if (key.downArrow || input === "j") {
      dispatch(moveSelectionDown({ listLength: filteredNotifications.length }));
    }

    if (key.upArrow || input === "k") {
      dispatch(moveSelectionUp());
    }

    // Open in browser (has side effect: Bun.spawn)
    if (key.return) {
      const selected = filteredNotifications[state.selectedIndex];
      if (selected) {
        Bun.spawn(["open", selected.url]);
      }
    }

    // m = mark as read (has side effect: mutation callback)
    if (input === "m") {
      const selected = filteredNotifications[state.selectedIndex];
      if (selected?.unread) {
        onMarkRead(selected.id);
      }
    }

    // M = mark as unread (has side effect: mutation callback)
    if (input === "M") {
      const selected = filteredNotifications[state.selectedIndex];
      if (selected && !selected.unread) {
        onMarkUnread(selected.id);
      }
    }

    // d or y = mark as done (has side effect: mutation callback)
    if (input === "d" || input === "y") {
      const selected = filteredNotifications[state.selectedIndex];
      if (selected) {
        onMarkDone(selected.id);
        dispatch(adjustSelectionAfterRemoval({ newListLength: filteredNotifications.length - 1 }));
      }
    }

    // R = refresh (has side effect: refresh callback)
    if (input === "R") {
      onRefresh();
    }

    // U = unsubscribe (has side effect: mutation callback)
    if (input === "U") {
      const selected = filteredNotifications[state.selectedIndex];
      if (selected) {
        onUnsubscribe(selected.id);
      }
    }
  });

  return {
    selectedIndex,
    selectedTabIndex,
    escapePressed,
    gPressed,
    exiting,
    showHelp,
  };
}
