import {Text} from '@nemesis-oss/termina-core';
import {ScrollBox} from '@nemesis-oss/termina-ui';

const rows = Array.from({length: 100}, (_, index) => `row ${index}`);

export default function Report() {
  return (
    <ScrollBox height={10}>
      {rows.map(row => (
        <Text key={row}>{row}</Text>
      ))}
    </ScrollBox>
  );
}
