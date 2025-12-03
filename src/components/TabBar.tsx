import React from "react";
import { Box, Text } from "ink";
import type { Tab } from "../store/selectors";

interface TabBarProps {
  tabs: Tab[];
  selectedIndex: number;
}

export function TabBar({ tabs, selectedIndex }: TabBarProps) {
  return (
    <Box gap={1}>
      {tabs.map((tab, idx) => {
        const isSelected = idx === selectedIndex;
        return (
          <Text key={tab.reason}>
            {isSelected ? (
              <Text color="black" backgroundColor="cyan" bold>
                {" "}{tab.reason} ({tab.count}){" "}
              </Text>
            ) : (
              <Text dimColor>
                [{tab.reason} ({tab.count})]
              </Text>
            )}
          </Text>
        );
      })}
    </Box>
  );
}
