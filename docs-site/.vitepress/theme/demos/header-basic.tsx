import {Box, Text} from '@nemesis-oss/termina-core';
import {Header} from '@nemesis-oss/termina-ui';

export default function HeaderBasic() {
  return (
    <Box flexDirection="column" gap={1}>
      <Header title="Deployer" subtitle="Targeting: production · Region: us-east-1" />
      <Box flexDirection="column">
        <Text>Deploying 3 services</Text>
        <Text color="green">api: done</Text>
        <Text color="green">worker: done</Text>
        <Text color="yellow">web: running</Text>
      </Box>
    </Box>
  );
}
