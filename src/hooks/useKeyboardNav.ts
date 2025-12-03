import { useEffect } from "react";
import { useInput } from "ink";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { setTabCount } from "../store/uiSlice";
import { handleKeyboardInput } from "../store/keyboardThunks";

interface UseKeyboardNavOptions {
  tabCount: number;
}

/**
 * Manages keyboard navigation via Redux.
 * Dispatches all key input to the handleKeyboardInput thunk.
 */
export function useKeyboardNav({ tabCount }: UseKeyboardNavOptions) {
  const dispatch = useAppDispatch();

  // Read from Redux for component render
  const { selectedIndex, selectedTabIndex, escapePressed, gPressed, exiting, showHelp } =
    useAppSelector((state) => state.ui);

  // Sync tabCount to store when it changes
  useEffect(() => {
    dispatch(setTabCount(tabCount));
  }, [tabCount, dispatch]);

  useInput((input, key) => {
    dispatch(
      handleKeyboardInput({
        input,
        key: {
          tab: key.tab,
          shift: key.shift,
          escape: key.escape,
          return: key.return,
          downArrow: key.downArrow,
          upArrow: key.upArrow,
        },
      })
    );
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
