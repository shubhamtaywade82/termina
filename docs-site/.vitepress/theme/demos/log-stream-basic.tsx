import {useEffect, useRef, useState} from 'react';
import {Box, Text} from '@nemesis-oss/termina-core';
import {LogStream} from '@nemesis-oss/termina-ui';

const services = ['api', 'worker', 'db', 'gateway'];

export default function Logs() {
  const [lines, setLines] = useState<string[]>([
    'boot  api      listening on :3000',
    'boot  worker   connected to the queue',
  ]);
  const counter = useRef(2);

  useEffect(() => {
    const timer = setInterval(() => {
      counter.current += 1;
      const service = services[counter.current % services.length];
      setLines(previous => [
        ...previous,
        `tick  ${service.padEnd(7, ' ')} heartbeat #${counter.current}`,
      ]);
    }, 450);

    return () => {
      clearInterval(timer);
    };
  }, []);

  return (
    <Box flexDirection="column">
      <Text>Up and Down scroll. End returns to the newest entry.</Text>
      <LogStream lines={lines} height={8} />
    </Box>
  );
}
