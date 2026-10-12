import {Box, Text} from '@nemesis-oss/termina-core';
import {DiffView} from '@nemesis-oss/termina-ui';

const patch = [
  'diff --git a/src/server.ts b/src/server.ts',
  'index 3b18e51..a9c4f0e 100644',
  '--- a/src/server.ts',
  '+++ b/src/server.ts',
  '@@ -1,5 +1,6 @@',
  " import express from 'express';",
  '-const PORT = 3000;',
  '+const PORT = process.env.PORT ?? 3000;',
  "+const HOST = '0.0.0.0';",
  ' ',
  ' const app = express();',
  ' app.listen(PORT);',
].join('\n');

export default function DiffViewBasic() {
  return (
    <Box flexDirection="column">
      <Text>Review the change to src/server.ts</Text>
      <DiffView patch={patch} />
    </Box>
  );
}
