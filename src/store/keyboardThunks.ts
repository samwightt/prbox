import { createAsyncThunk } from "@reduxjs/toolkit";
import type { RootState, AppDispatch } from "./index";
import {
  toggleHelp,
  setSelectedTabIndex,
  jumpToEnd,
  pressG,
  adjustSelectionAfterRemoval,
  moveSelectionUp,
  moveSelectionDown,
  setEscapePressed,
  setExiting,
  setShowHelp,
  setGPressed,
} from "./uiSlice";
import { notificationsApi } from "./api/notificationsApi";
import { selectFilteredNotifications, selectFilteredNotificationsLength, selectTabCount } from "./selectors";

/**
 * Thunk for navigating to the next tab.
 * Uses selectTabCount to wrap around.
 */
export const nextTab = createAsyncThunk<
  void,
  void,
  { state: RootState; dispatch: AppDispatch }
>("keyboard/nextTab", async (_, { dispatch, getState }) => {
  const state = getState();
  const tabCount = selectTabCount(state);
  const currentTab = state.ui.selectedTabIndex;
  dispatch(setSelectedTabIndex((currentTab + 1) % tabCount));
});

/**
 * Thunk for navigating to the previous tab.
 * Uses selectTabCount to wrap around.
 */
export const prevTab = createAsyncThunk<
  void,
  void,
  { state: RootState; dispatch: AppDispatch }
>("keyboard/prevTab", async (_, { dispatch, getState }) => {
  const state = getState();
  const tabCount = selectTabCount(state);
  const currentTab = state.ui.selectedTabIndex;
  dispatch(setSelectedTabIndex((currentTab - 1 + tabCount) % tabCount));
});

/**
 * Thunk for marking a notification as read.
 * Calls the RTK Query mutation which handles the optimistic update.
 */
export const markNotificationAsRead = createAsyncThunk<
  void,
  { notificationId: string },
  { state: RootState; dispatch: AppDispatch }
>("keyboard/markNotificationAsRead", async ({ notificationId }, { dispatch }) => {
  dispatch(notificationsApi.endpoints.markAsRead.initiate(notificationId));
});

/**
 * Thunk for marking a notification as unread.
 * Calls the RTK Query mutation which handles the optimistic update.
 */
export const markNotificationAsUnread = createAsyncThunk<
  void,
  { notificationId: string },
  { state: RootState; dispatch: AppDispatch }
>("keyboard/markNotificationAsUnread", async ({ notificationId }, { dispatch }) => {
  dispatch(notificationsApi.endpoints.markAsUnread.initiate(notificationId));
});

/**
 * Thunk for marking a notification as done.
 * Calls the RTK Query mutation and adjusts selection.
 */
export const markNotificationAsDone = createAsyncThunk<
  void,
  { notificationId: string; subjectId: string },
  { state: RootState; dispatch: AppDispatch }
>("keyboard/markNotificationAsDone", async ({ notificationId, subjectId }, { dispatch, getState }) => {
  const listLength = selectFilteredNotificationsLength(getState());
  dispatch(notificationsApi.endpoints.markAsDone.initiate({ id: notificationId, subjectId }));
  dispatch(adjustSelectionAfterRemoval({ newListLength: listLength - 1 }));
});

/**
 * Thunk for unsubscribing from a notification.
 * Calls the RTK Query mutation which handles the optimistic update.
 */
export const unsubscribeFromNotification = createAsyncThunk<
  void,
  { notificationId: string; subjectId: string },
  { state: RootState; dispatch: AppDispatch }
>("keyboard/unsubscribeFromNotification", async ({ notificationId, subjectId }, { dispatch }) => {
  dispatch(notificationsApi.endpoints.unsubscribe.initiate({ id: notificationId, subjectId }));
});

/**
 * Thunk for refreshing notifications.
 * Invalidates the RTK Query cache to trigger a refetch.
 */
export const refreshNotifications = createAsyncThunk<
  void,
  void,
  { state: RootState; dispatch: AppDispatch }
>("keyboard/refreshNotifications", async (_, { dispatch }) => {
  dispatch(notificationsApi.util.invalidateTags([{ type: "Notification", id: "LIST" }]));
});

/**
 * Thunk for handling escape key press.
 * Double-escape quits the app.
 */
export const handleEscapeKey = createAsyncThunk<
  void,
  void,
  { state: RootState; dispatch: AppDispatch }
>("keyboard/handleEscapeKey", async (_, { dispatch, getState }) => {
  const state = getState().ui;
  if (state.escapePressed) {
    dispatch(setExiting(true));
    setTimeout(() => process.exit(0), 50);
  } else {
    dispatch(setEscapePressed(true));
  }
});

/**
 * Thunk for quitting the app.
 */
export const quitApp = createAsyncThunk<
  void,
  void,
  { state: RootState; dispatch: AppDispatch }
>("keyboard/quitApp", async (_, { dispatch }) => {
  dispatch(setExiting(true));
  setTimeout(() => process.exit(0), 50);
});

/**
 * Thunk for opening the selected notification in browser.
 */
export const openInBrowser = createAsyncThunk<
  void,
  { url: string },
  { state: RootState; dispatch: AppDispatch }
>("keyboard/openInBrowser", async ({ url }) => {
  Bun.spawn(["open", url]);
});

interface HandleKeyboardInputPayload {
  input: string;
  key: {
    tab: boolean;
    shift: boolean;
    escape: boolean;
    return: boolean;
    downArrow: boolean;
    upArrow: boolean;
  };
}

/**
 * Main keyboard input handler thunk.
 * Handles all keyboard input for the app.
 */
export const handleKeyboardInput = createAsyncThunk<
  void,
  HandleKeyboardInputPayload,
  { state: RootState; dispatch: AppDispatch }
>("keyboard/handleInput", async ({ input, key }, { dispatch, getState }) => {
  const rootState = getState();
  const state = rootState.ui;
  const filteredNotifications = selectFilteredNotifications(rootState);
  const listLength = filteredNotifications.length;

  if (state.exiting) return;

  // Help toggle - special case, always handle "?"
  if (input === "?") {
    dispatch(toggleHelp());
    return;
  }

  // If help is showing, dismiss on any key
  if (state.showHelp) {
    dispatch(setShowHelp(false));
    return;
  }

  // Handle 'g' key specially (for gg motion)
  if (input === "g") {
    dispatch(pressG());
    return;
  }

  // Reset gPressed on any key except 'g'
  if (state.gPressed) {
    dispatch(setGPressed(false));
  }

  // Escape handling
  if (key.escape) {
    dispatch(handleEscapeKey());
    return;
  }

  // Reset escape on any other key
  if (state.escapePressed) {
    dispatch(setEscapePressed(false));
  }

  // Navigation keys
  if (input === "l" || (key.tab && !key.shift)) {
    dispatch(nextTab());
    return;
  }
  if (input === "h" || (key.tab && key.shift)) {
    dispatch(prevTab());
    return;
  }
  if (input === "G") {
    dispatch(jumpToEnd({ listLength }));
    return;
  }

  // Quit
  if (input === "q") {
    dispatch(quitApp());
    return;
  }

  // Selection navigation
  if (key.downArrow || input === "j") {
    dispatch(moveSelectionDown({ listLength }));
    return;
  }
  if (key.upArrow || input === "k") {
    dispatch(moveSelectionUp());
    return;
  }

  // Open in browser
  if (key.return) {
    const selected = filteredNotifications[state.selectedIndex];
    if (selected) {
      dispatch(openInBrowser({ url: selected.url }));
    }
    return;
  }

  // m = mark as read
  if (input === "m") {
    const selected = filteredNotifications[state.selectedIndex];
    if (selected?.unread) {
      dispatch(markNotificationAsRead({ notificationId: selected.id }));
    }
    return;
  }

  // M = mark as unread
  if (input === "M") {
    const selected = filteredNotifications[state.selectedIndex];
    if (selected && !selected.unread) {
      dispatch(markNotificationAsUnread({ notificationId: selected.id }));
    }
    return;
  }

  // d or y = mark as done
  if (input === "d" || input === "y") {
    const selected = filteredNotifications[state.selectedIndex];
    if (selected) {
      dispatch(markNotificationAsDone({
        notificationId: selected.id,
        subjectId: selected.subjectId,
      }));
    }
    return;
  }

  // U = unsubscribe
  if (input === "U") {
    const selected = filteredNotifications[state.selectedIndex];
    if (selected) {
      dispatch(unsubscribeFromNotification({
        notificationId: selected.id,
        subjectId: selected.subjectId,
      }));
    }
    return;
  }

  // R = refresh
  if (input === "R") {
    dispatch(refreshNotifications());
  }
});
