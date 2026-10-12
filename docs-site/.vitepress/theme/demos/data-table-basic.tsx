import {useState} from 'react';
import {Box, Text} from '@nemesis-oss/termina-core';
import {DataTable, type TableColumn, type TableRow} from '@nemesis-oss/termina-ui';

const columns: TableColumn[] = [
  {key: 'name', header: 'Process'},
  {key: 'pid', header: 'PID', align: 'right'},
  {key: 'cpu', header: 'CPU %', align: 'right'},
  {key: 'memory', header: 'Memory MB', align: 'right'},
  {key: 'status', header: 'Status'},
];

const processes: TableRow[] = [
  {name: 'nginx', pid: 1234, cpu: 1.8, memory: 126, status: 'running'},
  {name: 'node', pid: 5678, cpu: 10.1, memory: 248, status: 'running'},
  {name: 'redis', pid: 9012, cpu: 0.6, memory: 62, status: 'idle'},
  {name: 'postgres', pid: 3311, cpu: 4.2, memory: 310, status: 'running'},
  {name: 'worker', pid: 4410, cpu: 0.2, memory: 48, status: 'idle'},
  {name: 'cron', pid: 88, cpu: 0, memory: 3, status: 'stopped'},
];

export default function DataTableBasic() {
  const [selected, setSelected] = useState('none');

  return (
    <Box flexDirection="column" gap={1}>
      <Text>Up and down to move, s to sort, enter to select</Text>
      <DataTable
        columns={columns}
        rows={processes}
        onSelect={row => setSelected(String(row.name))}
      />
      <Text color="green">› selected {selected}</Text>
    </Box>
  );
}
