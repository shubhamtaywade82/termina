import {useState} from 'react';
import {Box, Text} from '@nemesis-oss/termina-core';
import {EmailInput} from '@nemesis-oss/termina-ui';

export default function Signup() {
  const [address, setAddress] = useState<string>();

  return (
    <Box flexDirection="column" gap={1}>
      <Text>Email address</Text>
      <EmailInput
        placeholder="name@example.com"
        domains={['@gmail.com', '@outlook.com', '@termina.dev']}
        onSubmit={value => {
          setAddress(value);
        }}
      />
      {address && (
        <Text color="green">✓ Verification link sent to {address}</Text>
      )}
    </Box>
  );
}
