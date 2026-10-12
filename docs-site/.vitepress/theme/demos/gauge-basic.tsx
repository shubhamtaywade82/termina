import {Box, Text} from '@nemesis-oss/termina-core';
import {Gauge} from '@nemesis-oss/termina-ui';

const metrics = [
  {label: 'CPU', value: 42},
  {label: 'MEM', value: 78},
  {label: 'DSK', value: 55},
  {label: 'NET', value: 93},
];

export default function GaugeBasic() {
  return (
    <Box flexDirection="column" gap={1}>
      <Text bold>Host metrics</Text>
      {metrics.map(metric => (
        <Gauge key={metric.label} label={metric.label} value={metric.value} />
      ))}
    </Box>
  );
}
