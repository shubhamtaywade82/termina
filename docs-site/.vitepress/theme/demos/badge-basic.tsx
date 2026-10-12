import {Box, Text} from '@nemesis-oss/termina-core';
import {Badge} from '@nemesis-oss/termina-ui';

export default function Checks() {
  return (
    <Box flexDirection="column" gap={1}>
      <Box gap={1}>
        <Badge color="green">pass</Badge>
        <Text>lint</Text>
      </Box>
      <Box gap={1}>
        <Badge color="red">fail</Badge>
        <Text>unit tests</Text>
      </Box>
      <Box gap={1}>
        <Badge color="yellow">warn</Badge>
        <Text>bundle size</Text>
      </Box>
      <Box gap={1}>
        <Badge color="cyan">skip</Badge>
        <Text>e2e on darwin</Text>
      </Box>
    </Box>
  );
}
