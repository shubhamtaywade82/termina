import {useState} from 'react';
import {Box, Text, useInput} from '@nemesis-oss/termina-core';
import {Modal, Select} from '@nemesis-oss/termina-ui';

const environments = [
  {label: 'Development', value: 'development'},
  {label: 'Staging', value: 'staging'},
  {label: 'Production', value: 'production'},
];

export default function ModalBasic() {
  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useState('development');

  useInput(input => {
    if (input === 'm') {
      setIsOpen(true);
    }
  });

  return (
    <Box flexDirection="column" width={56} height={9}>
      <Text>Target. Press m to open the dialog.</Text>
      <Select
        options={environments}
        defaultValue="development"
        visibleOptionCount={3}
        onChange={setValue}
      />
      <Text color="green">› deploying to {value}</Text>
      <Modal
        isOpen={isOpen}
        title="Dialog"
        width={40}
        onClose={() => {
          setIsOpen(false);
        }}
      >
        <Text>Arrow keys do not reach the Select.</Text>
        <Text>Press Escape to close.</Text>
      </Modal>
    </Box>
  );
}
