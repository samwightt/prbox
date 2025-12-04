import React, { useMemo, useState, useEffect } from "react";
import { Box, Text } from "ink";
import { randomLoadingText, getFirstName } from "../constants";

export function LoadingScreen() {
  const fullText = useMemo(() => randomLoadingText(getFirstName()), []);

  const [displayedLength, setDisplayedLength] = useState(0);

  useEffect(() => {
    if (displayedLength < fullText.length) {
      const timeout = setTimeout(() => {
        setDisplayedLength((len) => len + 1);
      }, 15);
      return () => clearTimeout(timeout);
    }
  }, [displayedLength, fullText.length]);

  return (
    <Box width="100%" height="100%" justifyContent="center" alignItems="center">
      <Text color="magenta">
        {fullText.slice(0, displayedLength)}
        {displayedLength < fullText.length && "█"}
      </Text>
    </Box>
  );
}
