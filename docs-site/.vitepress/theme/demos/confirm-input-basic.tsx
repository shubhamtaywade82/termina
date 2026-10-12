import {useState} from 'react';
import {Box, Text} from '@nemesis-oss/termina-core';
import {ConfirmInput} from '@nemesis-oss/termina-ui';

export default function Cleanup() {
  const [result, setResult] = useState<'deleted' | 'kept'>();

  return (
    <Box flexDirection="column" gap={1}>
      <Box gap={1}>
        <Text>Delete the build cache?</Text>
        <ConfirmInput
          defaultChoice="cancel"
          onConfirm={() => {
            setResult('deleted');
          }}
          onCancel={() => {
            setResult('kept');
          }}
        />
      </Box>
      {result === 'deleted' && <Text color="green">✓ Cache deleted</Text>}
      {result === 'kept' && <Text color="gray">✗ Nothing was deleted</Text>}
    </Box>
  );
}
