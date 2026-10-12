import {Box, Text} from '@nemesis-oss/termina-core';
import {KeyHint} from '@nemesis-oss/termina-ui';

const shortcuts = [
  {keys: '↑↓', label: 'navigate'},
  {keys: 'Space', label: 'toggle'},
  {keys: 'Enter', label: 'restart'},
  {keys: 'Esc', label: 'cancel'},
];

export default function KeyHintBasic() {
  return (
    <Box flexDirection="column" gap={1}>
      <Box flexDirection="column">
        <Text bold>Restart services</Text>
        <Text>› [x] api</Text>
        <Text>  [ ] worker</Text>
        <Text>  [x] web</Text>
      </Box>
      <Box gap={2}>
        {shortcuts.map(shortcut => (
          <KeyHint key={shortcut.keys} keys={shortcut.keys} label={shortcut.label} />
        ))}
      </Box>
    </Box>
  );
}
