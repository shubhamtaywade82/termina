import {useEffect, useState} from 'react';
import {Box, Text} from '@nemesis-oss/termina-core';
import {ProgressBar} from '@nemesis-oss/termina-ui';

export default function Download() {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (value >= 100) {
      const restart = setTimeout(() => {
        setValue(0);
      }, 1600);

      return () => {
        clearTimeout(restart);
      };
    }

    const timer = setTimeout(() => {
      setValue(current => Math.min(100, current + 5));
    }, 120);

    return () => {
      clearTimeout(timer);
    };
  }, [value]);

  return (
    <Box flexDirection="column" width={40} gap={1}>
      <Text>{value >= 100 ? 'Download complete' : `Downloading ${value}%`}</Text>
      <ProgressBar value={value} />
    </Box>
  );
}
