import {Box, Text} from '@nemesis-oss/termina-core';
import {Divider} from '@nemesis-oss/termina-ui';

export default function DividerBasic() {
  return (
    <Box flexDirection="column">
      <Text>Build finished in 4.2s</Text>
      <Divider />
      <Text>3 packages built, 0 errors</Text>
      <Divider title="Results" />
      <Text>dist/index.js 48.1 kB</Text>
      <Text>dist/cli.js 12.7 kB</Text>
      <Divider title="Next steps" />
      <Text>Run pnpm test to check the build.</Text>
    </Box>
  );
}
