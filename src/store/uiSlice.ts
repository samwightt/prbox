import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { Key } from "ink";

export interface KeyPress {
  input: string;
  key: Key;
}

export interface UiState {
  selectedIndex: number;
  selectedTabIndex: number;
  keyBuffer: KeyPress[];
  exiting: boolean;
  showHelp: boolean;
}

const initialState: UiState = {
  selectedIndex: 0,
  selectedTabIndex: 0,
  keyBuffer: [],
  exiting: false,
  showHelp: false,
};

export const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    // Selection navigation
    setSelectedIndex: (state, action: PayloadAction<number>) => {
      state.selectedIndex = action.payload;
    },
    moveSelectionUp: (state) => {
      state.selectedIndex = Math.max(state.selectedIndex - 1, 0);
    },
    moveSelectionDown: (state, action: PayloadAction<{ listLength: number }>) => {
      state.selectedIndex = Math.min(state.selectedIndex + 1, action.payload.listLength - 1);
    },
    jumpToStart: (state) => {
      state.selectedIndex = 0;
    },
    jumpToEnd: (state, action: PayloadAction<{ listLength: number }>) => {
      state.selectedIndex = Math.max(0, action.payload.listLength - 1);
    },

    // Tab navigation
    setSelectedTabIndex: (state, action: PayloadAction<number>) => {
      state.selectedTabIndex = action.payload;
      state.selectedIndex = 0;
    },

    // Key buffer for detecting sequences (gg, double-escape, etc.)
    pushKey: (state, action: PayloadAction<KeyPress>) => {
      state.keyBuffer.push(action.payload);
      // Keep buffer small (max 5 keys)
      if (state.keyBuffer.length > 5) {
        state.keyBuffer.shift();
      }
    },
    clearKeyBuffer: (state) => {
      state.keyBuffer = [];
    },

    // Exit and help
    setExiting: (state, action: PayloadAction<boolean>) => {
      state.exiting = action.payload;
    },
    toggleHelp: (state) => {
      state.showHelp = !state.showHelp;
    },
    setShowHelp: (state, action: PayloadAction<boolean>) => {
      state.showHelp = action.payload;
    },

    // Adjustment after item removal
    adjustSelectionAfterRemoval: (state, action: PayloadAction<{ newListLength: number }>) => {
      if (state.selectedIndex >= action.payload.newListLength) {
        state.selectedIndex = Math.max(0, action.payload.newListLength - 1);
      }
    },
  },
});

export const {
  setSelectedIndex,
  moveSelectionUp,
  moveSelectionDown,
  jumpToStart,
  jumpToEnd,
  setSelectedTabIndex,
  pushKey,
  clearKeyBuffer,
  setExiting,
  toggleHelp,
  setShowHelp,
  adjustSelectionAfterRemoval,
} = uiSlice.actions;

export default uiSlice.reducer;
