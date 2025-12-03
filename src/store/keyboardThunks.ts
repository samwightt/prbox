import { createAsyncThunk } from "@reduxjs/toolkit";
import type { Key } from "ink";
import type { RootState, AppDispatch } from "./index";
import {
  toggleHelp,
  setSelectedTabIndex,
  jumpToEnd,
  jumpToStart,
  adjustSelectionAfterRemoval,
  moveSelectionUp,
  moveSelectionDown,
  setExiting,
  setShowHelp,
  pushKey,
  clearKeyBuffer,
} from "./uiSlice";

// Timeout ID for auto-clearing the key buffer after inactivity
let bufferClearTimeout: ReturnType<typeof setTimeout> | null = null;

const BUFFER_TIMEOUT_MS = 2000;
import { notificationsApi } from "./api/notificationsApi";
import { selectFilteredNotificationsLength, selectSelectedNotification, selectTabCount } from "./selectors";

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
 * Only marks if the selected notification is unread.
 */
export const markNotificationAsRead = createAsyncThunk<
  void,
  void,
  { state: RootState; dispatch: AppDispatch }
>("keyboard/markNotificationAsRead", async (_, { dispatch, getState }) => {
  const selected = selectSelectedNotification(getState());
  if (selected?.unread) {
    dispatch(notificationsApi.endpoints.markAsRead.initiate(selected.id));
  }
});

/**
 * Thunk for marking a notification as unread.
 * Only marks if the selected notification is already read.
 */
export const markNotificationAsUnread = createAsyncThunk<
  void,
  void,
  { state: RootState; dispatch: AppDispatch }
>("keyboard/markNotificationAsUnread", async (_, { dispatch, getState }) => {
  const selected = selectSelectedNotification(getState());
  if (selected && !selected.unread) {
    dispatch(notificationsApi.endpoints.markAsUnread.initiate(selected.id));
  }
});

/**
 * Thunk for marking a notification as done.
 * Calls the RTK Query mutation and adjusts selection.
 */
export const markNotificationAsDone = createAsyncThunk<
  void,
  void,
  { state: RootState; dispatch: AppDispatch }
>("keyboard/markNotificationAsDone", async (_, { dispatch, getState }) => {
  const state = getState();
  const selected = selectSelectedNotification(state);
  if (selected) {
    const listLength = selectFilteredNotificationsLength(state);
    dispatch(notificationsApi.endpoints.markAsDone.initiate({ id: selected.id, subjectId: selected.subjectId }));
    dispatch(adjustSelectionAfterRemoval({ newListLength: listLength - 1 }));
  }
});

/**
 * Thunk for unsubscribing from a notification.
 * Calls the RTK Query mutation which handles the optimistic update.
 */
export const unsubscribeFromNotification = createAsyncThunk<
  void,
  void,
  { state: RootState; dispatch: AppDispatch }
>("keyboard/unsubscribeFromNotification", async (_, { dispatch, getState }) => {
  const selected = selectSelectedNotification(getState());
  if (selected) {
    dispatch(notificationsApi.endpoints.unsubscribe.initiate({ id: selected.id, subjectId: selected.subjectId }));
  }
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
 * Thunk for moving selection down.
 * Gets list length from selector.
 */
export const moveDown = createAsyncThunk<
  void,
  void,
  { state: RootState; dispatch: AppDispatch }
>("keyboard/moveDown", async (_, { dispatch, getState }) => {
  const listLength = selectFilteredNotificationsLength(getState());
  dispatch(moveSelectionDown({ listLength }));
});

/**
 * Thunk for jumping to end of list.
 * Gets list length from selector.
 */
export const jumpToListEnd = createAsyncThunk<
  void,
  void,
  { state: RootState; dispatch: AppDispatch }
>("keyboard/jumpToListEnd", async (_, { dispatch, getState }) => {
  const listLength = selectFilteredNotificationsLength(getState());
  dispatch(jumpToEnd({ listLength }));
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
  void,
  { state: RootState; dispatch: AppDispatch }
>("keyboard/openInBrowser", async (_, { getState }) => {
  const selected = selectSelectedNotification(getState());
  if (selected) {
    Bun.spawn(["open", selected.url]);
  }
});

interface HandleKeyboardInputPayload {
  input: string;
  key: Key;
}

type BufferEntry = { input: string; key: Key };

/**
 * Get the last key from the buffer.
 */
function lastKey(buffer: BufferEntry[]): BufferEntry | undefined {
  return buffer[buffer.length - 1];
}

/**
 * Check if the buffer ends with a specific input sequence.
 */
function bufferEndsWith(buffer: BufferEntry[], sequence: string[]): boolean {
  if (buffer.length < sequence.length) return false;
  return buffer
    .slice(-sequence.length)
    .map((k) => k.input)
    .every((input, i) => input === sequence[i]);
}

interface KeyBinding {
  match: (buffer: BufferEntry[]) => boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  action: () => any;
}

export interface HelpSection {
  title: string;
  bindings: { key: string; description: string }[];
}

/**
 * Declarative key bindings for the app.
 * Order matters - first match wins.
 * Match functions receive the buffer (including current key).
 */
const keyBindings: KeyBinding[] = [
  // Help toggle
  { match: (b) => lastKey(b)?.input === "?", action: toggleHelp },

  // Double escape -> quit
  { match: (b) => b.slice(-2).filter((k) => k.key.escape).length === 2, action: quitApp },

  // gg -> jump to start
  { match: (b) => bufferEndsWith(b, ["g", "g"]), action: () => jumpToStart() },

  // Tab navigation
  { match: (b) => lastKey(b)?.input === "l" || !!(lastKey(b)?.key.tab && !lastKey(b)?.key.shift), action: nextTab },
  { match: (b) => lastKey(b)?.input === "h" || !!(lastKey(b)?.key.tab && lastKey(b)?.key.shift), action: prevTab },

  // Jump to end
  { match: (b) => lastKey(b)?.input === "G", action: jumpToListEnd },

  // Quit
  { match: (b) => lastKey(b)?.input === "q", action: quitApp },

  // Selection navigation
  { match: (b) => !!(lastKey(b)?.key.downArrow || lastKey(b)?.input === "j"), action: moveDown },
  { match: (b) => !!(lastKey(b)?.key.upArrow || lastKey(b)?.input === "k"), action: () => moveSelectionUp() },

  // Open in browser
  { match: (b) => !!lastKey(b)?.key.return, action: openInBrowser },

  // Mark as read/unread
  { match: (b) => lastKey(b)?.input === "m", action: markNotificationAsRead },
  { match: (b) => lastKey(b)?.input === "M", action: markNotificationAsUnread },

  // Mark as done
  { match: (b) => lastKey(b)?.input === "d" || lastKey(b)?.input === "y", action: markNotificationAsDone },

  // Unsubscribe
  { match: (b) => lastKey(b)?.input === "U", action: unsubscribeFromNotification },

  // Refresh
  { match: (b) => lastKey(b)?.input === "R", action: refreshNotifications },
];

/**
 * Help sections for the help screen, organized by category.
 */
export const helpSections: HelpSection[] = [
  {
    title: "Navigation",
    bindings: [
      { key: "Tab/l", description: "Next category" },
      { key: "⇧Tab/h", description: "Previous category" },
      { key: "↑/k", description: "Move up" },
      { key: "↓/j", description: "Move down" },
      { key: "gg", description: "Go to top" },
      { key: "G", description: "Go to bottom" },
    ],
  },
  {
    title: "Actions",
    bindings: [
      { key: "Enter", description: "Open PR in browser" },
      { key: "m", description: "Mark as read" },
      { key: "M", description: "Mark as unread" },
      { key: "d/y", description: "Mark as done" },
      { key: "U", description: "Unsubscribe" },
      { key: "R", description: "Refresh" },
    ],
  },
  {
    title: "Other",
    bindings: [
      { key: "Esc×2", description: "Quit" },
      { key: "q", description: "Quit" },
      { key: "?", description: "Toggle this help" },
    ],
  },
];

/**
 * Main keyboard input handler thunk.
 * Handles all keyboard input for the app.
 */
export const handleKeyboardInput = createAsyncThunk<
  void,
  HandleKeyboardInputPayload,
  { state: RootState; dispatch: AppDispatch }
>("keyboard/handleInput", async ({ input, key }, { dispatch, getState }) => {
  const state = getState().ui;

  if (state.exiting) return;

  // If help is showing, dismiss on any key except "?"
  if (state.showHelp && input !== "?") {
    dispatch(setShowHelp(false));
    return;
  }

  // Build buffer with current key for matching
  const bufferWithCurrent = [...state.keyBuffer, { input, key }];

  // Find matching keybinding
  const binding = keyBindings.find((b) => b.match(bufferWithCurrent));

  // Clear any existing timeout since we got a keypress
  if (bufferClearTimeout) {
    clearTimeout(bufferClearTimeout);
    bufferClearTimeout = null;
  }

  if (binding) {
    // Match found - execute action and clear buffer
    dispatch(clearKeyBuffer());
    dispatch(binding.action());
  } else {
    // No match - push to buffer for potential future sequence
    dispatch(pushKey({ input, key }));

    // Set timeout to clear buffer after 2 seconds of inactivity
    bufferClearTimeout = setTimeout(() => {
      dispatch(clearKeyBuffer());
      bufferClearTimeout = null;
    }, BUFFER_TIMEOUT_MS);
  }
});
