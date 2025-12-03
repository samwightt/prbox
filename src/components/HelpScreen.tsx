import React from "react";
import { Box, Text } from "ink";

export function HelpScreen() {
  return (
    <Box flexDirection="column" padding={2}>
      <Text bold color="cyan">Keyboard Shortcuts</Text>
      <Text dimColor>{"─".repeat(30)}</Text>
      <Text> </Text>
      <Text><Text bold color="yellow">Tab/l</Text>    Next category</Text>
      <Text><Text bold color="yellow">⇧Tab/h</Text>   Previous category</Text>
      <Text> </Text>
      <Text><Text bold color="yellow">↑/k</Text>      Move up</Text>
      <Text><Text bold color="yellow">↓/j</Text>      Move down</Text>
      <Text><Text bold color="yellow">gg</Text>       Go to top</Text>
      <Text><Text bold color="yellow">G</Text>        Go to bottom</Text>
      <Text> </Text>
      <Text><Text bold color="yellow">Enter</Text>    Open PR in browser</Text>
      <Text><Text bold color="yellow">m</Text>        Mark as read</Text>
      <Text><Text bold color="yellow">M</Text>        Mark as unread</Text>
      <Text><Text bold color="yellow">d/y</Text>      Mark as done</Text>
      <Text><Text bold color="yellow">U</Text>        Unsubscribe</Text>
      <Text><Text bold color="yellow">R</Text>        Refresh</Text>
      <Text> </Text>
      <Text><Text bold color="yellow">Esc×2</Text>    Quit</Text>
      <Text><Text bold color="yellow">q</Text>        Quit</Text>
      <Text><Text bold color="yellow">?</Text>        Toggle this help</Text>
      <Text> </Text>
      <Text dimColor>Press any key to close</Text>
    </Box>
  );
}
