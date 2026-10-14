import {useState} from 'react';
import {Box, Text} from '@nemesis-oss/termina-core';
import {MultilineTextInput} from '@nemesis-oss/termina-ui';

export default function Notes() {
  const [saved, setSaved] = useState<string>();

  return (
    <Box flexDirection="column" gap={1}>
      <Text>Release notes · Ctrl+D saves</Text>
      <MultilineTextInput
        rows={4}
        placeholder="One change per line"
        onSubmit={text => {
          setSaved(text);
        }}
      />
      {saved !== undefined && (
        <Text color="green">› saved {saved.split('\n').length} lines</Text>
      )}
    </Box>
  );
}
