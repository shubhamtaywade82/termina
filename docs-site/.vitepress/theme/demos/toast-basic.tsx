import {useState} from 'react';
import {Box, Text, useInput} from '@nemesis-oss/termina-core';
import {Toast} from '@nemesis-oss/termina-ui';

export default function ToastBasic() {
  const [deployCount, setDeployCount] = useState(0);
  const [isToastShown, setIsToastShown] = useState(false);

  useInput(input => {
    if (input === 'd') {
      setDeployCount(count => count + 1);
      setIsToastShown(true);
    }
  });

  return (
    <Box flexDirection="column" gap={1}>
      <Text>Press d to deploy. The toast hides itself after 3 seconds.</Text>
      {isToastShown && (
        <Toast key={deployCount} variant="success" onDismiss={() => setIsToastShown(false)}>
          Deployed to production
        </Toast>
      )}
      <Text color="gray">{isToastShown ? 'Toast showing' : 'Toast hidden'}</Text>
    </Box>
  );
}
