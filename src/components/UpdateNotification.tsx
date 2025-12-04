import React from "react";
import { Box, Text } from "ink";
import { useUpdateChecker } from "../hooks/useUpdateChecker";

export function UpdateNotification() {
  const updateInfo = useUpdateChecker();

  if (!updateInfo?.hasUpdate) {
    return null;
  }

  const pkg = `prbox@${updateInfo.latestVersion}`;
  const updateCommands = {
    bun: `bun install -g ${pkg}`,
    npm: `npm install -g ${pkg}`,
    yarn: `yarn global add ${pkg}`,
    pnpm: `pnpm add -g ${pkg}`,
  };
  const updateCommand = updateCommands[updateInfo.packageManager];

  return (
    <Box marginTop={1}>
      <Text dimColor>
        Update available: {updateInfo.currentVersion} → {updateInfo.latestVersion} (run{" "}
        <Text color="cyan">{updateCommand}</Text> to update)
      </Text>
    </Box>
  );
}
