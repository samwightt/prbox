#!/usr/bin/env node
import React, { useEffect } from "react";
import { Box, Text, useApp } from "ink";
import { withFullScreen } from "fullscreen-ink";
import { Provider } from "react-redux";
import { store } from "./store";
import { useAppSelector } from "./store/hooks";
import { useGetNotificationsQuery, flushPendingMutations } from "./store/api/notificationsApi";
import {
  selectNotificationsLoading,
  selectNotificationsError,
} from "./store/selectors";
import { useKeyboardNav } from "./hooks/useKeyboardNav";
import { ByeScreen } from "./components/ByeScreen";
import { HelpScreen } from "./components/HelpScreen";
import { LoadingScreen } from "./components/LoadingScreen";
import { MainLayout } from "./components/MainLayout";

function App() {
  const app = useApp();

  // Trigger RTK Query fetch (data accessed via selectors)
  useGetNotificationsQuery(undefined, {
    pollingInterval: 10 * 60 * 1000, // 10 minutes
  });

  const loading = useAppSelector(selectNotificationsLoading);
  const error = useAppSelector(selectNotificationsError);
  const ui = useKeyboardNav();

  // Exit the app properly when exiting state is set
  useEffect(() => {
    if (ui.exiting) {
      // Flush any pending mutations and wait for them before exiting
      flushPendingMutations().then(() => {
        app.exit();
      });
    }
  }, [ui.exiting, app]);

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

  return <MainLayout />;
}

// Wrap with Redux Provider
function Root() {
  return (
    <Provider store={store}>
      <App />
    </Provider>
  );
}

const app = withFullScreen(<Root />, { patchConsole: false });
await app.start();
await app.waitUntilExit();
process.exit(0);
