import {useState} from 'react';
import {Box, Text, useInput} from '@nemesis-oss/termina-core';
import {Dialog} from '@nemesis-oss/termina-ui';

export default function DialogBasic() {
  const [isOpen, setIsOpen] = useState(true);

  useInput(input => {
    if (input === 'd') {
      setIsOpen(true);
    }
  });

  return (
    <Box flexDirection="column" gap={1}>
      <Text>Press d to open the dialog</Text>
      {isOpen && (
        <Dialog title="Confirm delete" width={50} onClose={() => setIsOpen(false)}>
          <Text>Remove 3 files from ./build?</Text>
          <Text>This cannot be undone.</Text>
        </Dialog>
      )}
      <Text color="green">{isOpen ? '› open, press Esc to close' : '› closed'}</Text>
    </Box>
  );
}
