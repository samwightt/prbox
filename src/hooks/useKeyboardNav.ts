import { useState, useEffect, useRef } from "react";
import { useInput } from "ink";
import type { ParsedNotification } from "../types";

interface UseKeyboardNavOptions {
  tabCount: number;
  onMarkRead: (id: string) => void;
  onMarkUnread: (id: string) => void;
  onMarkDone: (id: string) => void;
  onUnsubscribe: (id: string) => void;
  onRefresh: () => void;
}

/**
 * Manages keyboard navigation state.
 * Returns selectedTabIndex which should be used to filter the list,
 * then call setFilteredList with the result.
 */
export function useKeyboardNav({ tabCount, onMarkRead, onMarkUnread, onMarkDone, onUnsubscribe, onRefresh }: UseKeyboardNavOptions) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);
  const [escapePressed, setEscapePressed] = useState(false);
  const [gPressed, setGPressed] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Store filtered list in a ref so useInput callback can access current value
  const filteredListRef = useRef<ParsedNotification[]>([]);

  // Reset selection when tab changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [selectedTabIndex]);

  useInput((input, key) => {
    if (exiting) return;

    const filteredList = filteredListRef.current;

    // Toggle help with ?
    if (input === "?") {
      setShowHelp((h) => !h);
      return;
    }

    // Dismiss help on any key
    if (showHelp) {
      setShowHelp(false);
      return;
    }

    if (key.escape) {
      if (escapePressed) {
        setExiting(true);
        setTimeout(() => process.exit(0), 50);
      } else {
        setEscapePressed(true);
        setGPressed(false);
      }
      return;
    }

    // Reset escape on any other key
    if (escapePressed) {
      setEscapePressed(false);
    }

    // Tab/l = next tab, Shift+Tab/h = previous tab
    if (key.tab || input === "l") {
      if (key.shift) {
        setSelectedTabIndex((i) => (i - 1 + tabCount) % tabCount);
      } else {
        setSelectedTabIndex((i) => (i + 1) % tabCount);
      }
      return;
    }

    if (input === "h") {
      setSelectedTabIndex((i) => (i - 1 + tabCount) % tabCount);
      return;
    }

    // Handle g/G vim motions
    if (input === "G") {
      setSelectedIndex(Math.max(0, filteredList.length - 1));
      setGPressed(false);
      return;
    }

    if (input === "g") {
      if (gPressed) {
        setSelectedIndex(0);
        setGPressed(false);
      } else {
        setGPressed(true);
      }
      return;
    }

    // Reset g on any other key
    if (gPressed) {
      setGPressed(false);
    }

    if (input === "q") {
      setExiting(true);
      setTimeout(() => process.exit(0), 50);
      return;
    }

    if (key.downArrow || input === "j") {
      setSelectedIndex((i) => Math.min(i + 1, filteredList.length - 1));
    }

    if (key.upArrow || input === "k") {
      setSelectedIndex((i) => Math.max(i - 1, 0));
    }

    if (key.return) {
      const selected = filteredList[selectedIndex];
      if (selected) {
        Bun.spawn(["open", selected.url]);
      }
    }

    // m = mark as read
    if (input === "m") {
      const selected = filteredList[selectedIndex];
      if (selected && selected.unread) {
        onMarkRead(selected.id);
      }
    }

    // M = mark as unread
    if (input === "M") {
      const selected = filteredList[selectedIndex];
      if (selected && !selected.unread) {
        onMarkUnread(selected.id);
      }
    }

    // d or y = mark as done (y for gmail muscle memory)
    if (input === "d" || input === "y") {
      const selected = filteredList[selectedIndex];
      if (selected) {
        onMarkDone(selected.id);
        // Adjust selection if we removed the last item
        if (selectedIndex >= filteredList.length - 1) {
          setSelectedIndex((i) => Math.max(0, i - 1));
        }
      }
    }

    // R = refresh
    if (input === "R") {
      onRefresh();
    }

    // U = unsubscribe
    if (input === "U") {
      const selected = filteredList[selectedIndex];
      if (selected) {
        onUnsubscribe(selected.id);
      }
    }
  });

  // Function to update the filtered list ref
  const setFilteredList = (list: ParsedNotification[]) => {
    filteredListRef.current = list;
  };

  return {
    selectedIndex,
    selectedTabIndex,
    escapePressed,
    gPressed,
    exiting,
    showHelp,
    setFilteredList,
  };
}
