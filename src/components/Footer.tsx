import React from "react";
import { Box, Text } from "ink";

const TAB_HELP: Record<string, string> = {
  "needs your review": "You or your team's review is showing as pending on these PRs.",
  "replied to you": "Someone replied to one of your comments on these PRs.",
  "already reviewed": "You already reviewed these PRs.",
  "team reviewed": "Your review was requested, but a teammate already reviewed.",
  mention: "You were mentioned in these PRs.",
  comment: "New comments on PRs you're involved with.",
  merged: "These PRs have been merged (or closed).",
  draft: "These PRs are still drafts.",
};

interface FooterProps {
  gPressed: boolean;
  escapePressed: boolean;
  selectedTab: string | null;
}

export function Footer({ gPressed, escapePressed, selectedTab }: FooterProps) {
  const helpText = selectedTab ? TAB_HELP[selectedTab] : null;

  return (
    <>
      <Text dimColor>{"─".repeat(60)}</Text>
      {helpText && <Text dimColor italic>{helpText}</Text>}
      <Box justifyContent="space-between">
        <Text dimColor>tab/shift+tab switch • ↑/↓ nav • enter open • m/M read/unread • d/y done • ? help</Text>
        <Box>
          {gPressed && <Text color="yellow">g</Text>}
          {escapePressed && <Text color="yellow">Press Esc again to quit</Text>}
        </Box>
      </Box>
    </>
  );
}
