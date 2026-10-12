import {useState} from 'react';
import {Box, Text} from '@nemesis-oss/termina-core';
import {TextInput} from '@nemesis-oss/termina-ui';

const commands = ['deploy', 'destroy', 'status'];

export default function Prompt() {
  const [submitted, setSubmitted] = useState<string>();

  return (
    <Box flexDirection="column" gap={1}>
      <Text>Command</Text>
      <TextInput
        placeholder="type a command"
        suggestions={commands}
        onSubmit={command => {
          setSubmitted(command);
        }}
      />
      {submitted && <Text color="green">› running {submitted}…</Text>}
    </Box>
  );
}
