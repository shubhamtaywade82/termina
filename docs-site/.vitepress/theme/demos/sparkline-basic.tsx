import {Box, Text} from '@nemesis-oss/termina-core';
import {Sparkline} from '@nemesis-oss/termina-ui';

const requestsPerSecond = [42, 45, 51, 48, 63, 70, 66, 58, 61, 77, 84, 79, 71, 68, 74, 88];
const p95LatencyMs = [120, 118, 131, 127, 140, 152, 149, 138, 133, 128, 126, 124, 130, 129, 127, 125];
const errorsPerMinute = [0, 1, 0, 0, 2, 1, 0, 0, 0, 5, 3, 1, 0, 0, 1, 0];

export default function SparklineBasic() {
  return (
    <Box flexDirection="column" gap={1}>
      <Text bold>api-gateway · last 16 minutes</Text>
      <Box flexDirection="column">
        <Box gap={1}>
          <Box width={10}>
            <Text>req/s</Text>
          </Box>
          <Sparkline data={requestsPerSecond} />
        </Box>
        <Box gap={1}>
          <Box width={10}>
            <Text>p95 ms</Text>
          </Box>
          <Sparkline data={p95LatencyMs} width={12} />
        </Box>
        <Box gap={1}>
          <Box width={10}>
            <Text>errors</Text>
          </Box>
          <Sparkline data={errorsPerMinute} />
        </Box>
      </Box>
    </Box>
  );
}
