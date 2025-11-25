import React, { useEffect } from "react";
import { render, Box, Text, useStdout } from "ink";
import { useNotifications } from "./hooks/useNotifications";
import { useTabs, useFilteredNotifications, useVisibleNotifications } from "./hooks/useDisplayItems";
import { useKeyboardNav } from "./hooks/useKeyboardNav";
import { ByeScreen } from "./components/ByeScreen";
import { HelpScreen } from "./components/HelpScreen";
import { LoadingScreen } from "./components/LoadingScreen";
import { NotificationList } from "./components/NotificationList";
import { TabBar } from "./components/TabBar";
import { Footer } from "./components/Footer";

function App() {
  const { stdout } = useStdout();
  const terminalHeight = stdout?.rows ?? 24;

  // 1. Fetch notifications
  const { notifications, loading, refreshing, error, markAsRead, markAsUnread, markAsDone, unsubscribe, refresh } = useNotifications();

  // 2. Get tabs from notifications
  const tabs = useTabs(notifications);

  // 3. Handle keyboard navigation
  const nav = useKeyboardNav({
    tabCount: tabs.length || 1, // Avoid division by zero
    onMarkRead: markAsRead,
    onMarkUnread: markAsUnread,
    onMarkDone: markAsDone,
    onUnsubscribe: unsubscribe,
    onRefresh: refresh,
  });

  // 4. Get selected tab and filter notifications
  const selectedTab = tabs[nav.selectedTabIndex]?.reason ?? null;
  const filteredNotifications = useFilteredNotifications(notifications, selectedTab);

  // 5. Update the filtered list ref in nav hook
  useEffect(() => {
    nav.setFilteredList(filteredNotifications);
  }, [filteredNotifications]);

  // 6. Calculate visible notifications
  const { visible: visibleNotifications, scrollOffset } = useVisibleNotifications(
    filteredNotifications,
    nav.selectedIndex,
    terminalHeight
  );

  if (nav.exiting) {
    return <ByeScreen />;
  }

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text bold color="red">Error</Text>
        <Text>{error}</Text>
      </Box>
    );
  }

  if (nav.showHelp) {
    return <HelpScreen />;
  }

  // Get repo name (just the first one for now)
  const repoName = notifications[0]?.repo ?? "";

  return (
    <Box flexDirection="column" height={terminalHeight}>
      {/* Header */}
      <Text bold color="cyan">
        Notifications ({notifications.length}){refreshing && <Text color="yellow"> Refreshing...</Text>}
      </Text>
      <Text dimColor>{"─".repeat(60)}</Text>

      {/* Repo name */}
      <Text bold color="blue">{repoName}</Text>

      {/* Tab bar */}
      <TabBar tabs={tabs} selectedIndex={nav.selectedTabIndex} />

      {/* Scrollable content */}
      <NotificationList notifications={visibleNotifications} selectedIndex={nav.selectedIndex} scrollOffset={scrollOffset} />

      {/* Footer */}
      <Footer gPressed={nav.gPressed} escapePressed={nav.escapePressed} selectedTab={selectedTab} />
    </Box>
  );
}

render(<App />, { patchConsole: false });
