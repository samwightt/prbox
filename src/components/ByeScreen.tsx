import React, { useMemo } from "react";
import { Text } from "ink";
import { randomKaomoji, randomFarewell, getFirstName } from "../constants";

export function ByeScreen() {
  const kaomoji = useMemo(() => randomKaomoji(), []);
  const farewell = useMemo(() => randomFarewell(getFirstName()), []);
  return <Text color="magenta">{farewell} {kaomoji}</Text>;
}
