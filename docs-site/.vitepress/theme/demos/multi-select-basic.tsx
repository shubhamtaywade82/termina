import {useState} from 'react';
import {Box, Text} from '@nemesis-oss/termina-core';
import {MultiSelect} from '@nemesis-oss/termina-ui';

const toppings = [
  {label: 'Cheese', value: 'cheese'},
  {label: 'Ham', value: 'ham'},
  {label: 'Pineapple', value: 'pineapple'},
  {label: 'Olives', value: 'olives'},
  {label: 'Peppers', value: 'peppers'},
  {label: 'Onions', value: 'onions'},
];

export default function Order() {
  const [chosen, setChosen] = useState<string[]>(['cheese']);

  return (
    <Box flexDirection="column" gap={1}>
      <Text>Toppings (space to toggle, enter to submit)</Text>
      <MultiSelect
        options={toppings}
        defaultValue={['cheese']}
        onSubmit={setChosen}
      />
      <Text color="green">› ordered: {chosen.join(', ')}</Text>
    </Box>
  );
}
