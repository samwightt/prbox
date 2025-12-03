import { useInput } from "ink";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { handleKeyboardInput } from "../store/keyboardThunks";

/**
 * Manages keyboard navigation via Redux.
 * Dispatches all key input to the handleKeyboardInput thunk.
 */
export function useKeyboardNav() {
  const dispatch = useAppDispatch();

  // Read from Redux for component render
  const { selectedIndex, selectedTabIndex, escapePressed, gPressed, exiting, showHelp } =
    useAppSelector((state) => state.ui);

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
