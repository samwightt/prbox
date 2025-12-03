import React from "react";
import { Box, Text } from "ink";
import { useAppSelector } from "../store/hooks";
import { selectTabs } from "../store/selectors";

export function TabBar() {
  const tabs = useAppSelector(selectTabs);
  const selectedIndex = useAppSelector((state) => state.ui.selectedTabIndex);

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
