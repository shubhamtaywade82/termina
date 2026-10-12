import {Box, Text} from '@nemesis-oss/termina-core';
import {Table, type TableColumn, type TableRow} from '@nemesis-oss/termina-ui';

const columns: TableColumn[] = [
  {key: 'name', header: 'Name'},
  {key: 'pid', header: 'PID', align: 'right'},
  {key: 'cpu', header: 'CPU', align: 'right'},
  {key: 'status', header: 'Status'},
];

const processes: TableRow[] = [
  {name: 'nginx', pid: 1234, cpu: '0.4%', status: 'running'},
  {name: 'node', pid: 5678, cpu: '12.9%', status: 'running'},
  {name: 'redis-server', pid: 9012, cpu: '0.1%', status: 'stopped'},
];

export default function TableBasic() {
  const runningCount = processes.filter(row => row.status === 'running').length;

  return (
    <Box flexDirection="column" gap={1}>
      <Text>Processes on this host</Text>
      <Table columns={columns} rows={processes} />
      <Text color="green">
        {runningCount} of {processes.length} running
      </Text>
    </Box>
  );
}
