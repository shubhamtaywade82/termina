import {useState} from 'react';
import {Box, Text} from '@nemesis-oss/termina-core';
import {SplitPane} from '@nemesis-oss/termina-ui';

const files = ['src/index.ts', 'src/render.ts', 'src/App.tsx', 'README.md'];

export default function SplitPaneBasic() {
  const [ratio, setRatio] = useState(0.3);

  return (
    <Box flexDirection="column" height={9}>
      <Text>Tab focuses the split. Ctrl+Left and Ctrl+Right move it.</Text>
      <Text color="green">› first pane {Math.round(ratio * 100)}%</Text>
      <SplitPane ratio={ratio} onRatioChange={setRatio} minSize={12} resizable>
        <Box flexDirection="column">
          {files.map(file => (
            <Text key={file}>{file}</Text>
          ))}
        </Box>
        <Text>Editor</Text>
      </SplitPane>
    </Box>
  );
}
