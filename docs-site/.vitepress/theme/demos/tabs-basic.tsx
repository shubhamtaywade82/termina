import {useState} from 'react';
import {Box, Text} from '@nemesis-oss/termina-core';
import {Tabs} from '@nemesis-oss/termina-ui';

const tabs = [
  {id: 'files', label: 'Files', content: <Text>src/index.ts</Text>},
  {
    id: 'logs',
    label: 'Logs',
    content: (
      <>
        <Text>12:01  server started</Text>
        <Text>12:02  listening on :3000</Text>
      </>
    ),
  },
  {id: 'config', label: 'Config', content: <Text>theme: dark</Text>},
];

export default function TabsBasic() {
  const [tabId, setTabId] = useState('files');

  return (
    <Box flexDirection="column" gap={1}>
      <Tabs tabs={tabs} onChange={setTabId} />
      <Text color="green">› viewing {tabId}</Text>
    </Box>
  );
}
