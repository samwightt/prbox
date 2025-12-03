import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface UiState {
  selectedIndex: number;
  selectedTabIndex: number;
  escapePressed: boolean;
  gPressed: boolean;
  exiting: boolean;
  showHelp: boolean;
  tabCount: number;
}

const initialState: UiState = {
  selectedIndex: 0,
  selectedTabIndex: 0,
  escapePressed: false,
  gPressed: false,
  exiting: false,
  showHelp: false,
  tabCount: 1,
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
    nextTab: (state) => {
      state.selectedTabIndex = (state.selectedTabIndex + 1) % state.tabCount;
      state.selectedIndex = 0;
    },
    prevTab: (state) => {
      state.selectedTabIndex = (state.selectedTabIndex - 1 + state.tabCount) % state.tabCount;
      state.selectedIndex = 0;
    },
    setTabCount: (state, action: PayloadAction<number>) => {
      state.tabCount = Math.max(1, action.payload);
      if (state.selectedTabIndex >= state.tabCount) {
        state.selectedTabIndex = state.tabCount - 1;
      }
    },

    // Vim motion states
    setGPressed: (state, action: PayloadAction<boolean>) => {
      state.gPressed = action.payload;
    },
    // Handle 'g' key - if gPressed, jump to start (gg), otherwise set gPressed
    pressG: (state) => {
      if (state.gPressed) {
        state.selectedIndex = 0;
        state.gPressed = false;
      } else {
        state.gPressed = true;
      }
    },

    // Escape handling
    setEscapePressed: (state, action: PayloadAction<boolean>) => {
      state.escapePressed = action.payload;
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
  nextTab,
  prevTab,
  setTabCount,
  setGPressed,
  pressG,
  setEscapePressed,
  setExiting,
  toggleHelp,
  setShowHelp,
  adjustSelectionAfterRemoval,
} = uiSlice.actions;

export default uiSlice.reducer;
