import { describe, test, expect } from "bun:test";
import type { UiState } from "./uiSlice";
import uiReducer, {
  nextTab,
  prevTab,
  setTabCount,
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
  tabCount: 1,
  terminalHeight: 24,
};

describe("uiSlice", () => {
  describe("tab navigation", () => {
    test("nextTab wraps around", () => {
      const state = { ...initialState, tabCount: 3, selectedTabIndex: 2 };
      const result = uiReducer(state, nextTab());
      expect(result.selectedTabIndex).toBe(0);
    });

    test("nextTab increments normally", () => {
      const state = { ...initialState, tabCount: 3, selectedTabIndex: 0 };
      const result = uiReducer(state, nextTab());
      expect(result.selectedTabIndex).toBe(1);
    });

    test("prevTab wraps around", () => {
      const state = { ...initialState, tabCount: 3, selectedTabIndex: 0 };
      const result = uiReducer(state, prevTab());
      expect(result.selectedTabIndex).toBe(2);
    });

    test("prevTab decrements normally", () => {
      const state = { ...initialState, tabCount: 3, selectedTabIndex: 2 };
      const result = uiReducer(state, prevTab());
      expect(result.selectedTabIndex).toBe(1);
    });

    test("tab change resets selectedIndex to 0", () => {
      const state = { ...initialState, tabCount: 3, selectedTabIndex: 0, selectedIndex: 5 };
      const result = uiReducer(state, nextTab());
      expect(result.selectedIndex).toBe(0);
    });

    test("setTabCount adjusts selectedTabIndex if out of bounds", () => {
      const state = { ...initialState, tabCount: 5, selectedTabIndex: 4 };
      const result = uiReducer(state, setTabCount(3));
      expect(result.tabCount).toBe(3);
      expect(result.selectedTabIndex).toBe(2);
    });

    test("setTabCount minimum is 1", () => {
      const state = { ...initialState, tabCount: 3 };
      const result = uiReducer(state, setTabCount(0));
      expect(result.tabCount).toBe(1);
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

    test("setSelectedTabIndex resets selectedIndex", () => {
      const state = { ...initialState, selectedIndex: 5, selectedTabIndex: 0 };
      const result = uiReducer(state, setSelectedTabIndex(2));
      expect(result.selectedTabIndex).toBe(2);
      expect(result.selectedIndex).toBe(0);
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
