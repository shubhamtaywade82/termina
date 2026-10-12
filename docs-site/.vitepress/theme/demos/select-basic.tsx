import {useState} from 'react';
import {Box, Text} from '@nemesis-oss/termina-core';
import {Select} from '@nemesis-oss/termina-ui';

const environments = [
  {label: 'Development', value: 'development'},
  {label: 'Staging', value: 'staging'},
  {label: 'Production', value: 'production'},
];

export default function Target() {
  const [value, setValue] = useState('development');

  return (
    <Box flexDirection="column" gap={1}>
      <Text>Target (up and down to move, enter to select)</Text>
      <Select options={environments} defaultValue="development" onChange={setValue} />
      <Text color="green">› deploying to {value}</Text>
    </Box>
  );
}
