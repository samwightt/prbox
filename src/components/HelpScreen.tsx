import React from "react";
import { Box, Text } from "ink";
import { helpSections } from "../store/keyboardThunks";

const KEY_WIDTH = 8;

export function HelpScreen() {
  return (
    <Box flexDirection="column" padding={2}>
      <Text bold color="cyan">Keyboard Shortcuts</Text>
      <Text dimColor>{"─".repeat(30)}</Text>
      {helpSections.map((section) => (
        <React.Fragment key={section.title}>
          <Text> </Text>
          {section.bindings.map((binding) => (
            <Text key={binding.key}>
              <Text bold color="yellow">{binding.key.padEnd(KEY_WIDTH)}</Text>
              {binding.description}
            </Text>
          ))}
        </React.Fragment>
      ))}
      <Text> </Text>
      <Text dimColor>Press any key to close</Text>
    </Box>
  );
}
