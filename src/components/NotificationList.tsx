import React from "react";
import { Box } from "ink";
import { NotificationItem } from "./NotificationItem";
import type { ParsedNotification } from "../types";

interface NotificationListProps {
  notifications: ParsedNotification[];
  selectedIndex: number;
  scrollOffset: number;
}

export function NotificationList({ notifications, selectedIndex, scrollOffset }: NotificationListProps) {
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
