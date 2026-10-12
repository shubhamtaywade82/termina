import {Box} from '@nemesis-oss/termina-core';
import {Alert} from '@nemesis-oss/termina-ui';

export default function Notices() {
  return (
    <Box flexDirection="column" gap={1} width={62}>
      <Alert variant="info" title="Heads up">
        The config file now lives in .config/termina/.
      </Alert>
      <Alert variant="success" title="Deployed">
        Release 2.4.0 is live on staging.
      </Alert>
      <Alert variant="warning" title="Deprecated command">
        The sync command is deprecated. Run update instead.
      </Alert>
      <Alert variant="error" title="Build failed">
        Type error in src/cli.tsx:42 — expected a string.
      </Alert>
    </Box>
  );
}
