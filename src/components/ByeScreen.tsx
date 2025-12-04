import React, { useMemo } from "react";
import { Box, Text } from "ink";
import { randomKaomoji, randomFarewell, getFirstName } from "../constants";

export function ByeScreen() {
  const kaomoji = useMemo(() => randomKaomoji(), []);
  const farewell = useMemo(() => randomFarewell(getFirstName()), []);
  return (
    <Box width="100%" height="100%" justifyContent="center" alignItems="center">
      <Text color="magenta">{farewell} {kaomoji}</Text>
    </Box>
  );
}
