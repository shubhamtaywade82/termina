import {useEffect, useState} from 'react';
import {Box, Text} from '@nemesis-oss/termina-core';
import {LoadingBar} from '@nemesis-oss/termina-ui';

export default function LoadingBarBasic() {
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setIsActive(current => !current);
    }, 3000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  return (
    <Box flexDirection="column" gap={1}>
      <Text>Waiting for server...</Text>
      <LoadingBar width={30} isActive={isActive} />
      <Text color={isActive ? 'blue' : 'yellow'}>
        {isActive ? '› request in flight' : '› request on hold'}
      </Text>
    </Box>
  );
}
