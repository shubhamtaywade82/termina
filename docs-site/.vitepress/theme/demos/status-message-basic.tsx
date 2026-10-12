import {Box} from '@nemesis-oss/termina-core';
import {StatusMessage} from '@nemesis-oss/termina-ui';

export default function Results() {
  return (
    <Box flexDirection="column" gap={1}>
      <StatusMessage variant="success">Saved 3 files</StatusMessage>
      <StatusMessage variant="info">Watching for changes</StatusMessage>
      <StatusMessage variant="warning">
        The timeout key is deprecated
      </StatusMessage>
      <StatusMessage variant="error">Upload failed: connection reset</StatusMessage>
    </Box>
  );
}
