import {useState} from 'react';
import {Box, Text} from '@nemesis-oss/termina-core';
import {Autocomplete} from '@nemesis-oss/termina-ui';

const packages = [
  'express',
  'fastify',
  'react',
  'react-dom',
  'redux',
  'typescript',
  'vite',
  'vitest',
  'vue',
];

export default function AutocompleteBasic() {
  const [value, setValue] = useState('');

  return (
    <Box flexDirection="column" gap={1}>
      <Text>Install package (type to filter, enter to choose)</Text>
      <Autocomplete
        options={packages}
        placeholder="Search packages..."
        onChange={setValue}
      />
      <Text color="green">› package: {value || '(none)'}</Text>
    </Box>
  );
}
