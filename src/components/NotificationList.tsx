import React, { useRef, useState, useLayoutEffect } from "react";
import { Box, measureElement, type DOMElement } from "ink";
import { useScreenSize } from "fullscreen-ink";
import { NotificationItem } from "./NotificationItem";
import { useAppSelector } from "../store/hooks";
import { selectFilteredNotifications } from "../store/selectors";

export function NotificationList() {
  const ref = useRef<DOMElement>(null);
  const { height: screenHeight } = useScreenSize();
  const [measuredHeight, setMeasuredHeight] = useState<number | null>(null);
  const notifications = useAppSelector(selectFilteredNotifications);
  const selectedIndex = useAppSelector((state) => state.ui.selectedIndex);

  // Measure the available height after layout
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    if (ref.current) {
      const { height } = measureElement(ref.current);
      setMeasuredHeight(height);
    }
  });

  // Use measured height if available, otherwise fall back to screen height
  const availableHeight = measuredHeight ?? screenHeight;

  const maxVisible = Math.max(1, availableHeight);
  const halfVisible = Math.floor(maxVisible / 2);

  // Calculate scroll offset to keep selection centered
  let scrollOffset = 0;
  if (selectedIndex > halfVisible) {
    scrollOffset = Math.min(
      selectedIndex - halfVisible,
      Math.max(0, notifications.length - maxVisible)
    );
  }

  const visibleNotifications = notifications.slice(scrollOffset, scrollOffset + maxVisible);

  return (
    <Box ref={ref} flexDirection="column" flexGrow={1} overflowY="hidden">
      {visibleNotifications.map((notification, idx) => (
        <Box key={notification.id} marginLeft={2}>
          <NotificationItem
            notification={notification}
            isSelected={idx + scrollOffset === selectedIndex}
          />
        </Box>
      ))}
    </Box>
  );
}
