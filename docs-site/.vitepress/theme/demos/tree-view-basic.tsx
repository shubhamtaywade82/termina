import {useState} from 'react';
import {Box, Text} from '@nemesis-oss/termina-core';
import {TreeView, type TreeViewNode} from '@nemesis-oss/termina-ui';

const project: TreeViewNode[] = [
  {
    label: 'src',
    children: [
      {label: 'components', children: [{label: 'Button.tsx'}, {label: 'Input.tsx'}]},
      {label: 'index.ts'},
    ],
  },
  {label: 'docs', children: [{label: 'guides', children: [{label: 'intro.md'}]}]},
  {label: 'package.json'},
];

export default function TreeViewBasic() {
  const [lastSelected, setLastSelected] = useState('nothing yet');

  return (
    <Box flexDirection="column" gap={1}>
      <Text>Project (arrows to move, enter to select)</Text>
      <TreeView nodes={project} onSelect={(_label, path) => setLastSelected(path.join('/'))} />
      <Text color="green">› last selected: {lastSelected}</Text>
    </Box>
  );
}
