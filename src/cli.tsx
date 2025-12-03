import React, { useCallback } from "react";
import { render, Box, Text, useStdout } from "ink";
import { Provider } from "react-redux";
import { store } from "./store";
import { useAppSelector } from "./store/hooks";
import {
  useGetNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAsUnreadMutation,
  useMarkAsDoneMutation,
  useUnsubscribeMutation,
} from "./store/api/notificationsApi";
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

  // 1. Fetch notifications via RTK Query
  const {
    data: notifications = [],
    isLoading: loading,
    isFetching: refreshing,
    error: queryError,
    refetch: refresh,
  } = useGetNotificationsQuery(undefined, {
    pollingInterval: 10 * 60 * 1000, // 10 minutes
  });

  // Extract error message
  const error = queryError ? (queryError as { message?: string }).message ?? String(queryError) : null;

  // Mutation hooks
  const [markAsReadMutation] = useMarkAsReadMutation();
  const [markAsUnreadMutation] = useMarkAsUnreadMutation();
  const [markAsDoneMutation] = useMarkAsDoneMutation();
  const [unsubscribeMutation] = useUnsubscribeMutation();

  // Wrap mutations to match callback interface (id: string) => void
  const markAsRead = useCallback((id: string) => {
    markAsReadMutation(id);
  }, [markAsReadMutation]);

  const markAsUnread = useCallback((id: string) => {
    markAsUnreadMutation(id);
  }, [markAsUnreadMutation]);

  const markAsDone = useCallback((id: string) => {
    const notification = notifications.find((n) => n.id === id);
    if (notification) {
      markAsDoneMutation({ id, subjectId: notification.subjectId });
    }
  }, [markAsDoneMutation, notifications]);

  const unsubscribe = useCallback((id: string) => {
    const notification = notifications.find((n) => n.id === id);
    if (notification) {
      unsubscribeMutation({ id, subjectId: notification.subjectId });
    }
  }, [unsubscribeMutation, notifications]);

  // 2. Get tabs from notifications
  const tabs = useTabs(notifications);

  // 3. Get selectedTabIndex from Redux FIRST (needed to compute filteredNotifications)
  const selectedTabIndex = useAppSelector((state) => state.ui.selectedTabIndex);
  const selectedTab = tabs[selectedTabIndex]?.reason ?? null;

  // 4. Filter notifications based on selected tab
  const filteredNotifications = useFilteredNotifications(notifications, selectedTab);

  // 5. Handle keyboard navigation - pass filteredNotifications directly!
  const nav = useKeyboardNav({
    tabCount: tabs.length || 1,
    filteredNotifications,
    onMarkRead: markAsRead,
    onMarkUnread: markAsUnread,
    onMarkDone: markAsDone,
    onUnsubscribe: unsubscribe,
    onRefresh: refresh,
  });

  // NO MORE useEffect to sync filteredNotifications!

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

// Wrap with Redux Provider
function Root() {
  return (
    <Provider store={store}>
      <App />
    </Provider>
  );
}

render(<Root />, { patchConsole: false });
