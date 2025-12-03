import React from "react";
import { Box, Text } from "ink";
import { useAppSelector } from "../store/hooks";
import {
  selectNotifications,
  selectNotificationsRefreshing,
} from "../store/selectors";
import { NotificationList } from "./NotificationList";
import { TabBar } from "./TabBar";
import { Footer } from "./Footer";

export function MainLayout() {
  const notifications = useAppSelector(selectNotifications);
  const refreshing = useAppSelector(selectNotificationsRefreshing);

  const repoName = notifications[0]?.repo ?? "";

  return (
    <Box flexDirection="column" width="100%" height="100%">
      {/* Header */}
      <Box flexDirection="column" flexShrink={0}>
        <Text bold color="cyan">
          Notifications ({notifications.length}){refreshing && <Text color="yellow"> Refreshing...</Text>}
        </Text>
        <Text dimColor>{"─".repeat(60)}</Text>

        {/* Repo name */}
        <Text bold color="blue">{repoName}</Text>

        {/* Tab bar */}
        <TabBar />
      </Box>

      {/* Scrollable content */}
      <NotificationList />

      {/* Footer */}
      <Footer />
    </Box>
  );
}
