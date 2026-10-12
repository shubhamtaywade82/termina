import {useState} from 'react';
import {Box, Text} from '@nemesis-oss/termina-core';
import {PasswordInput} from '@nemesis-oss/termina-ui';

export default function Login() {
  const [accepted, setAccepted] = useState<number>();

  return (
    <Box flexDirection="column" gap={1}>
      <Text>API key</Text>
      <PasswordInput
        placeholder="Paste your key"
        onSubmit={value => {
          setAccepted(value.length);
        }}
      />
      {accepted !== undefined && (
        <Text color="green">✓ Key accepted ({accepted} characters)</Text>
      )}
    </Box>
  );
}
