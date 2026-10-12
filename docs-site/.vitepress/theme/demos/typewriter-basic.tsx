import {useState} from 'react';
import {Box, Text} from '@nemesis-oss/termina-core';
import {Typewriter} from '@nemesis-oss/termina-ui';

export default function TypewriterBasic() {
  const [isGreeted, setIsGreeted] = useState(false);
  const [isReady, setIsReady] = useState(false);

  return (
    <Box flexDirection="column" gap={1}>
      <Typewriter
        text="Welcome to termina. Build terminal apps with React."
        speed={40}
        onComplete={() => setIsGreeted(true)}
      />
      {isGreeted && (
        <Typewriter
          text="Run pnpm dev to start the watcher."
          speed={40}
          onComplete={() => setIsReady(true)}
        />
      )}
      <Text color={isReady ? 'green' : 'blue'}>{isReady ? '› ready' : '› typing'}</Text>
    </Box>
  );
}
