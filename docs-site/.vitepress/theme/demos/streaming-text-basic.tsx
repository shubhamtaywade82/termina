import {useEffect, useState} from 'react';
import {Box, Text} from '@nemesis-oss/termina-core';
import {StreamingText} from '@nemesis-oss/termina-ui';

const answer =
  'Staging is green. Three services were rolled to build 4821, and all of them passed their health checks. Production is next and waits for approval from the on-call engineer.';
const CHARACTERS_PER_CHUNK = 3;
const CHUNK_INTERVAL_MS = 50;
const RESTART_DELAY_MS = 2000;

export default function StreamingTextBasic() {
  const [text, setText] = useState('');
  const isStreaming = text.length < answer.length;

  useEffect(() => {
    const timer = setTimeout(
      () => {
        setText(isStreaming ? answer.slice(0, text.length + CHARACTERS_PER_CHUNK) : '');
      },
      isStreaming ? CHUNK_INTERVAL_MS : RESTART_DELAY_MS,
    );

    return () => {
      clearTimeout(timer);
    };
  }, [text, isStreaming]);

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold>Assistant</Text>
      <StreamingText text={text} isStreaming={isStreaming} />
      <Text color={isStreaming ? 'yellow' : 'green'}>{isStreaming ? 'streaming' : 'done'}</Text>
    </Box>
  );
}
