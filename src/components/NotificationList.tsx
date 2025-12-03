import React, { useMemo } from "react";
import { Box } from "ink";
import { useScreenSize } from "fullscreen-ink";
import { NotificationItem } from "./NotificationItem";
import { useAppSelector } from "../store/hooks";
import { makeSelectVisibleNotifications } from "../store/selectors";

export function NotificationList() {
  const { height } = useScreenSize();
  const selectVisibleNotifications = useMemo(() => makeSelectVisibleNotifications(height), [height]);
  const { visible: notifications, scrollOffset } = useAppSelector(selectVisibleNotifications);
  const selectedIndex = useAppSelector((state) => state.ui.selectedIndex);

  return (
    <Box flexDirection="column" flexGrow={1}>
      {notifications.map((notification, idx) => (
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
