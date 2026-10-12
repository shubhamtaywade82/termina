import {Box, Text} from '@nemesis-oss/termina-core';
import {Stepper} from '@nemesis-oss/termina-ui';

const steps = [
  'Install dependencies',
  'Configure API keys',
  'Deploy to production',
  'Run smoke tests',
];

export default function StepperBasic() {
  return (
    <Box flexDirection="column" gap={1}>
      <Text>Installing my-cli</Text>
      <Stepper steps={steps} current={1} />
    </Box>
  );
}
