import { describe, test, expect } from "bun:test";
import type { UiState } from "./uiSlice";
import uiReducer, {
  moveSelectionUp,
  moveSelectionDown,
  jumpToStart,
  jumpToEnd,
  toggleHelp,
  setShowHelp,
  setEscapePressed,
  setGPressed,
  pressG,
  setExiting,
  adjustSelectionAfterRemoval,
  setSelectedIndex,
  setSelectedTabIndex,
} from "./uiSlice";

const initialState: UiState = {
  selectedIndex: 0,
  selectedTabIndex: 0,
  escapePressed: false,
  gPressed: false,
  exiting: false,
  showHelp: false,
  terminalHeight: 24,
};

describe("uiSlice", () => {
  // Note: nextTab/prevTab are now thunks in keyboardThunks.ts that use selectTabCount
  describe("tab navigation", () => {
    test("setSelectedTabIndex resets selectedIndex to 0", () => {
      const state = { ...initialState, selectedTabIndex: 0, selectedIndex: 5 };
      const result = uiReducer(state, setSelectedTabIndex(2));
      expect(result.selectedTabIndex).toBe(2);
      expect(result.selectedIndex).toBe(0);
    });
  });

  describe("selection navigation", () => {
    test("moveSelectionDown clamps to list length", () => {
      const state = { ...initialState, selectedIndex: 4 };
      const result = uiReducer(state, moveSelectionDown({ listLength: 5 }));
      expect(result.selectedIndex).toBe(4);
    });

    test("moveSelectionDown increments normally", () => {
      const state = { ...initialState, selectedIndex: 2 };
      const result = uiReducer(state, moveSelectionDown({ listLength: 5 }));
      expect(result.selectedIndex).toBe(3);
    });

    test("moveSelectionUp clamps to 0", () => {
      const state = { ...initialState, selectedIndex: 0 };
      const result = uiReducer(state, moveSelectionUp());
      expect(result.selectedIndex).toBe(0);
    });

    test("moveSelectionUp decrements normally", () => {
      const state = { ...initialState, selectedIndex: 3 };
      const result = uiReducer(state, moveSelectionUp());
      expect(result.selectedIndex).toBe(2);
    });

    test("setSelectedIndex sets exact value", () => {
      const state = { ...initialState, selectedIndex: 0 };
      const result = uiReducer(state, setSelectedIndex(5));
      expect(result.selectedIndex).toBe(5);
    });

  });

  describe("vim motions", () => {
    test("jumpToStart sets index to 0", () => {
      const state = { ...initialState, selectedIndex: 10 };
      const result = uiReducer(state, jumpToStart());
      expect(result.selectedIndex).toBe(0);
    });

    test("jumpToEnd sets to listLength - 1", () => {
      const state = { ...initialState, selectedIndex: 0 };
      const result = uiReducer(state, jumpToEnd({ listLength: 10 }));
      expect(result.selectedIndex).toBe(9);
    });

    test("jumpToEnd handles empty list", () => {
      const state = { ...initialState, selectedIndex: 0 };
      const result = uiReducer(state, jumpToEnd({ listLength: 0 }));
      expect(result.selectedIndex).toBe(0);
    });

    test("pressG sets gPressed flag when not pressed", () => {
      const state = { ...initialState, gPressed: false };
      const result = uiReducer(state, pressG());
      expect(result.gPressed).toBe(true);
    });

    test("pressG jumps to start when gPressed (gg)", () => {
      const state = { ...initialState, selectedIndex: 5, gPressed: true };
      const result = uiReducer(state, pressG());
      expect(result.selectedIndex).toBe(0);
      expect(result.gPressed).toBe(false);
    });
  });

  describe("state flags", () => {
    test("toggleHelp toggles showHelp", () => {
      const state = { ...initialState, showHelp: false };
      const result1 = uiReducer(state, toggleHelp());
      expect(result1.showHelp).toBe(true);
      const result2 = uiReducer(result1, toggleHelp());
      expect(result2.showHelp).toBe(false);
    });

    test("setShowHelp sets exact value", () => {
      const state = { ...initialState, showHelp: true };
      const result = uiReducer(state, setShowHelp(false));
      expect(result.showHelp).toBe(false);
    });

    test("setEscapePressed sets value", () => {
      const state = { ...initialState, escapePressed: false };
      const result = uiReducer(state, setEscapePressed(true));
      expect(result.escapePressed).toBe(true);
    });

    test("setGPressed sets value", () => {
      const state = { ...initialState, gPressed: false };
      const result = uiReducer(state, setGPressed(true));
      expect(result.gPressed).toBe(true);
    });

    test("setExiting sets value", () => {
      const state = { ...initialState, exiting: false };
      const result = uiReducer(state, setExiting(true));
      expect(result.exiting).toBe(true);
    });
  });

  describe("edge cases", () => {
    test("adjustSelectionAfterRemoval when on last item", () => {
      const state = { ...initialState, selectedIndex: 4 };
      const result = uiReducer(state, adjustSelectionAfterRemoval({ newListLength: 4 }));
      expect(result.selectedIndex).toBe(3);
    });

    test("adjustSelectionAfterRemoval when not on last item", () => {
      const state = { ...initialState, selectedIndex: 2 };
      const result = uiReducer(state, adjustSelectionAfterRemoval({ newListLength: 4 }));
      expect(result.selectedIndex).toBe(2);
    });

    test("adjustSelectionAfterRemoval handles empty list", () => {
      const state = { ...initialState, selectedIndex: 0 };
      const result = uiReducer(state, adjustSelectionAfterRemoval({ newListLength: 0 }));
      expect(result.selectedIndex).toBe(0);
    });
  });

});
