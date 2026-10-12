import {Box, Text} from '@nemesis-oss/termina-core';
import {TokenCounter} from '@nemesis-oss/termina-ui';

export default function TokenCounterBasic() {
  return (
    <Box flexDirection="column" gap={1}>
      <Text bold>Context budget · claude-sonnet</Text>
      <Box flexDirection="column">
        <Text>Session, no limit</Text>
        <TokenCounter count={18342} />
      </Box>
      <Box flexDirection="column">
        <Text>Prompt, under budget</Text>
        <TokenCounter count={2480} limit={4096} />
      </Box>
      <Box flexDirection="column">
        <Text>Prompt, near the budget</Text>
        <TokenCounter count={3512} limit={4096} />
      </Box>
      <Box flexDirection="column">
        <Text>Prompt, over budget</Text>
        <TokenCounter count={4410} limit={4096} />
      </Box>
    </Box>
  );
}
