import { describe, test, expect } from "bun:test";
import type { UiState } from "./uiSlice";
import uiReducer, {
  moveSelectionUp,
  moveSelectionDown,
  jumpToStart,
  jumpToEnd,
  toggleHelp,
  setShowHelp,
  setExiting,
  adjustSelectionAfterRemoval,
  setSelectedIndex,
  setSelectedTabIndex,
  pushKey,
  clearKeyBuffer,
} from "./uiSlice";

const initialState: UiState = {
  selectedIndex: 0,
  selectedTabIndex: 0,
  keyBuffer: [],
  exiting: false,
  showHelp: false,
  terminalHeight: 24,
};

const mockKey = {
  upArrow: false,
  downArrow: false,
  leftArrow: false,
  rightArrow: false,
  pageDown: false,
  pageUp: false,
  return: false,
  escape: false,
  ctrl: false,
  shift: false,
  tab: false,
  backspace: false,
  delete: false,
  meta: false,
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

    test("setExiting sets value", () => {
      const state = { ...initialState, exiting: false };
      const result = uiReducer(state, setExiting(true));
      expect(result.exiting).toBe(true);
    });
  });

  describe("key buffer", () => {
    test("pushKey adds key to buffer", () => {
      const state = { ...initialState };
      const result = uiReducer(state, pushKey({ input: "g", key: mockKey }));
      expect(result.keyBuffer).toHaveLength(1);
      expect(result.keyBuffer[0]!.input).toBe("g");
    });

    test("pushKey accumulates keys", () => {
      const state = {
        ...initialState,
        keyBuffer: [{ input: "a", key: mockKey }],
      };
      const result = uiReducer(state, pushKey({ input: "b", key: mockKey }));
      expect(result.keyBuffer).toHaveLength(2);
      expect(result.keyBuffer[0]!.input).toBe("a");
      expect(result.keyBuffer[1]!.input).toBe("b");
    });

    test("pushKey limits buffer to 5 keys", () => {
      const state = {
        ...initialState,
        keyBuffer: [
          { input: "a", key: mockKey },
          { input: "b", key: mockKey },
          { input: "c", key: mockKey },
          { input: "d", key: mockKey },
          { input: "e", key: mockKey },
        ],
      };
      const result = uiReducer(state, pushKey({ input: "f", key: mockKey }));
      expect(result.keyBuffer).toHaveLength(5);
      expect(result.keyBuffer[0]!.input).toBe("b");
      expect(result.keyBuffer[4]!.input).toBe("f");
    });

    test("clearKeyBuffer empties buffer", () => {
      const state = {
        ...initialState,
        keyBuffer: [
          { input: "a", key: mockKey },
          { input: "b", key: mockKey },
        ],
      };
      const result = uiReducer(state, clearKeyBuffer());
      expect(result.keyBuffer).toHaveLength(0);
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
