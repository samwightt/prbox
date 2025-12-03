import React, { useEffect } from "react";
import { render, Box, Text, useStdout } from "ink";
import { Provider } from "react-redux";
import { store } from "./store";
import { useAppSelector, useAppDispatch } from "./store/hooks";
import { useGetNotificationsQuery } from "./store/api/notificationsApi";
import { setTerminalHeight } from "./store/uiSlice";
import {
  selectNotifications,
  selectNotificationsLoading,
  selectNotificationsRefreshing,
  selectNotificationsError,
  selectTabs,
  selectSelectedTab,
  selectVisibleNotifications,
  selectEscapePressed,
  selectGPressed,
} from "./store/selectors";
import { useKeyboardNav } from "./hooks/useKeyboardNav";
import { ByeScreen } from "./components/ByeScreen";
import { HelpScreen } from "./components/HelpScreen";
import { LoadingScreen } from "./components/LoadingScreen";
import { NotificationList } from "./components/NotificationList";
import { TabBar } from "./components/TabBar";
import { Footer } from "./components/Footer";

function App() {
  const dispatch = useAppDispatch();
  const { stdout } = useStdout();
  const terminalHeight = stdout?.rows ?? 24;

  // Sync terminal height to Redux
  useEffect(() => {
    dispatch(setTerminalHeight(terminalHeight));
  }, [terminalHeight, dispatch]);

  // Trigger RTK Query fetch (data accessed via selectors)
  useGetNotificationsQuery(undefined, {
    pollingInterval: 10 * 60 * 1000, // 10 minutes
  });

  // Select all data from Redux
  const notifications = useAppSelector(selectNotifications);
  const loading = useAppSelector(selectNotificationsLoading);
  const refreshing = useAppSelector(selectNotificationsRefreshing);
  const error = useAppSelector(selectNotificationsError);
  const tabs = useAppSelector(selectTabs);
  const selectedTab = useAppSelector(selectSelectedTab);
  const { visible: visibleNotifications, scrollOffset } = useAppSelector(selectVisibleNotifications);

  // Handle keyboard navigation
  const ui = useKeyboardNav();
  const escapePressed = useAppSelector(selectEscapePressed);
  const gPressed = useAppSelector(selectGPressed);

  if (ui.exiting) {
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

  if (ui.showHelp) {
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
      <TabBar tabs={tabs} selectedIndex={ui.selectedTabIndex} />

      {/* Scrollable content */}
      <NotificationList notifications={visibleNotifications} selectedIndex={ui.selectedIndex} scrollOffset={scrollOffset} />

      {/* Footer */}
      <Footer gPressed={gPressed} escapePressed={escapePressed} selectedTab={selectedTab} />
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
