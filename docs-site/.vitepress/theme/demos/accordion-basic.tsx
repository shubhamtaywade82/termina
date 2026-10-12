import {useState} from 'react';
import {Box, Text} from '@nemesis-oss/termina-core';
import {Accordion} from '@nemesis-oss/termina-ui';

const sections = [
  {
    id: 'database',
    title: 'Database',
    content: (
      <>
        <Text>host: localhost:5432</Text>
        <Text>pool size: 10</Text>
      </>
    ),
  },
  {
    id: 'api',
    title: 'API',
    content: (
      <>
        <Text>base: https://api.example.com</Text>
        <Text>timeout: 30s</Text>
      </>
    ),
  },
  {
    id: 'deploy',
    title: 'Deployment',
    content: <Text>target: staging</Text>,
  },
];

export default function AccordionBasic() {
  const [openIds, setOpenIds] = useState<string[]>(['api']);

  return (
    <Box flexDirection="column" gap={1}>
      <Text>Settings (up and down to move, enter to open)</Text>
      <Accordion items={sections} defaultOpenIds={['api']} onChange={setOpenIds} />
      <Text color="green">› open: {openIds.join(', ') || 'none'}</Text>
    </Box>
  );
}
