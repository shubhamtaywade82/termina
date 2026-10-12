import {useEffect, useState} from 'react';
import {Box, Text} from '@nemesis-oss/termina-core';
import {Badge, ProgressBar, Spinner, StatusMessage} from '@nemesis-oss/termina-ui';

const steps = [
  'Resolving the dependency tree',
  'Downloading packages',
  'Linking binaries',
  'Writing the lockfile',
];

export default function Hero() {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(current => {
        if (current >= 100) {
          setStep(currentStep => (currentStep + 1) % steps.length);
          return 0;
        }

        return Math.min(100, current + 4 + Math.round(Math.random() * 8));
      });
    }, 90);

    return () => {
      clearInterval(timer);
    };
  }, []);

  return (
    <Box flexDirection="column" gap={1}>
      <Box gap={1}>
        <Badge color="green">live</Badge>
        <Text>termina install</Text>
      </Box>

      <Box gap={1}>
        <Spinner type="dots" />
        <Text>{steps[step]}</Text>
      </Box>

      <ProgressBar value={progress} />

      <StatusMessage variant="success">212 packages resolved</StatusMessage>
      <StatusMessage variant="info">Click the terminal to try it yourself</StatusMessage>
    </Box>
  );
}
