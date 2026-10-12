import {Box, Text} from '@nemesis-oss/termina-core';
import {Spinner} from '@nemesis-oss/termina-ui';

export default function Install() {
  return (
    <Box flexDirection="column" gap={1}>
      <Spinner type="dots" label="Installing dependencies" />
      <Spinner type="line" label="Compiling native modules" />
      <Spinner type="clock" label="Waiting for the dev server" />
    </Box>
  );
}
