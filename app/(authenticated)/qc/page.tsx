'use client';

import {
  SimpleGrid, Paper, Text, Title, Group, Stack, ThemeIcon,
  Anchor, Divider, Badge, Alert, Table,
} from '@mantine/core';
import { DonutChart } from '@mantine/charts';
import { IconFlask, IconEye, IconAlertTriangle, IconCheck, IconX, IconCircleCheck, IconChevronRight } from '@tabler/icons-react';
import { DashboardLoading } from '@/components/ui/dashboard-loading';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface QueueBatch {
  id: string;
  batch_number: string;
  status: string;
  qty: number;
  unit: string;
}

export default function QCDashboard() {
  const router = useRouter();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [queue, setQueue] = useState<QueueBatch[]>([]);
  const [holds, setHolds] = useState<QueueBatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [c, queueData, holdData] = await Promise.all([
        fetch('/api/batch-counts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            counts: [
              { key: 'qcPending', collection: 'batches', filter: { status: { _eq: 'qc_pending' } } },
              { key: 'underQc', collection: 'batches', filter: { status: { _eq: 'under_qc' } } },
              { key: 'hold', collection: 'batches', filter: { status: { _eq: 'hold' } } },
              { key: 'rejected', collection: 'batches', filter: { status: { _eq: 'rejected' } } },
              { key: 'approved', collection: 'qc_inspections', filter: { decision: { _eq: 'approved' } } },
            ],
          }),
        }).then(async r => r.ok ? (await r.json())?.counts ?? {} : {}).catch(() => ({})),

        fetch('/api/items/batches?filter[status][_in]=qc_pending,under_qc&fields[]=id&fields[]=batch_number&fields[]=status&fields[]=qty&fields[]=unit&limit=8&sort[]=id')
          .then(async r => r.ok ? (await r.json())?.data ?? [] : []).catch(() => []),

        fetch('/api/items/batches?filter[status][_eq]=hold&fields[]=id&fields[]=batch_number&fields[]=status&fields[]=qty&fields[]=unit&limit=5&sort[]=-id')
          .then(async r => r.ok ? (await r.json())?.data ?? [] : []).catch(() => []),
      ]);

      setCounts(c);
      setQueue(queueData);
      setHolds(holdData);
      setLoading(false);
    }
    load();
  }, []);

  const n = (k: string) => counts[k] ?? 0;

  return (
    <Stack gap="lg">
      <div>
        <Title order={2}>QC Workbench</Title>
        <Text c="dimmed" size="sm">Inspect raw materials and finished goods, review AI suggestions, and record your quality decisions.</Text>
      </div>

      {loading ? <DashboardLoading cards={4} graphPanels={1} queuePanels={2} /> : (
        <>
          {/* ── Priority Cards ─────────────────────────────────────────────── */}
          <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
            <Paper p="md" radius="md" withBorder style={{ cursor: 'pointer', borderColor: n('qcPending') > 0 ? 'var(--mantine-color-orange-4)' : undefined }} onClick={() => router.push('/qc/queue')}>
              <Group justify="space-between" wrap="nowrap">
                <Stack gap={2}>
                  <Text size="xs" c="dimmed" fw={600} tt="uppercase">Waiting for Inspection</Text>
                  <Title order={2} c={n('qcPending') > 0 ? 'orange' : undefined}>{n('qcPending')}</Title>
                  <Text size="xs" c="dimmed">Batches in queue</Text>
                </Stack>
                <ThemeIcon size="xl" radius="md" variant={n('qcPending') > 0 ? 'filled' : 'light'} color="orange">
                  <IconFlask size={22} />
                </ThemeIcon>
              </Group>
            </Paper>

            <Paper p="md" radius="md" withBorder style={{ cursor: 'pointer' }} onClick={() => router.push('/qc/queue')}>
              <Group justify="space-between" wrap="nowrap">
                <Stack gap={2}>
                  <Text size="xs" c="dimmed" fw={600} tt="uppercase">Being Inspected</Text>
                  <Title order={2} c="blue">{n('underQc')}</Title>
                  <Text size="xs" c="dimmed">Inspections in progress</Text>
                </Stack>
                <ThemeIcon size="xl" radius="md" variant="light" color="blue">
                  <IconEye size={22} />
                </ThemeIcon>
              </Group>
            </Paper>

            <Paper p="md" radius="md" withBorder style={{ cursor: 'pointer', borderColor: n('hold') > 0 ? 'var(--mantine-color-yellow-4)' : undefined }} onClick={() => router.push('/qc/holds')}>
              <Group justify="space-between" wrap="nowrap">
                <Stack gap={2}>
                  <Text size="xs" c="dimmed" fw={600} tt="uppercase">On Hold — Decision Needed</Text>
                  <Title order={2} c={n('hold') > 0 ? 'yellow' : undefined}>{n('hold')}</Title>
                  <Text size="xs" c="dimmed">Awaiting final review</Text>
                </Stack>
                <ThemeIcon size="xl" radius="md" variant={n('hold') > 0 ? 'filled' : 'light'} color="yellow">
                  <IconAlertTriangle size={22} />
                </ThemeIcon>
              </Group>
            </Paper>

            <Paper p="md" radius="md" withBorder style={{ cursor: 'pointer', borderColor: n('rejected') > 0 ? 'var(--mantine-color-red-4)' : undefined }} onClick={() => router.push('/qc/holds')}>
              <Group justify="space-between" wrap="nowrap">
                <Stack gap={2}>
                  <Text size="xs" c="dimmed" fw={600} tt="uppercase">Rejected</Text>
                  <Title order={2} c={n('rejected') > 0 ? 'red' : undefined}>{n('rejected')}</Title>
                  <Text size="xs" c="dimmed">Need follow-up action</Text>
                </Stack>
                <ThemeIcon size="xl" radius="md" variant={n('rejected') > 0 ? 'filled' : 'light'} color="red">
                  <IconX size={22} />
                </ThemeIcon>
              </Group>
            </Paper>
          </SimpleGrid>

          {/* ── Status Breakdown ────────────────────────────────────────────── */}
          <Paper p="md" radius="md" withBorder>
            <Text fw={600} size="sm" mb="sm">Batch Quality Status Breakdown</Text>
            <DonutChart
              data={[
                { name: 'Waiting', value: n('qcPending'), color: 'orange.5' },
                { name: 'In review', value: n('underQc'), color: 'blue.5' },
                { name: 'On hold', value: n('hold'), color: 'yellow.5' },
                { name: 'Rejected', value: n('rejected'), color: 'red.5' },
                { name: 'Approved (total)', value: n('approved'), color: 'green.5' },
              ]}
              size={160}
              thickness={30}
              withLabels
              withLabelsLine={false}
            />
          </Paper>

          {/* ── Queue Tables ────────────────────────────────────────────────── */}
          <Divider label="Inspection Queue" labelPosition="left" />

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <Paper p="md" radius="md" withBorder>
              <Group justify="space-between" mb="sm">
                <Text fw={600} size="sm">Batches Waiting / In Progress</Text>
                <Anchor href="/qc/queue" size="xs">Open queue →</Anchor>
              </Group>
              {queue.length === 0 ? (
                <Alert color="green" variant="light" icon={<IconCircleCheck size={14} />}>
                  No batches waiting for inspection right now.
                </Alert>
              ) : (
                <Table withTableBorder>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Batch</Table.Th>
                      <Table.Th>Qty</Table.Th>
                      <Table.Th>Status</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {queue.map(b => (
                      <Table.Tr key={b.id} style={{ cursor: 'pointer' }} onClick={() => router.push(`/qc/inspect/${b.id}`)}>
                        <Table.Td><Text size="sm" style={{ fontFamily: 'monospace' }}>{b.batch_number}</Text></Table.Td>
                        <Table.Td><Text size="sm">{b.qty} {b.unit}</Text></Table.Td>
                        <Table.Td>
                          <Badge size="xs" color={b.status === 'qc_pending' ? 'orange' : 'blue'} variant="light">
                            {b.status === 'qc_pending' ? 'Waiting' : 'Being inspected'}
                          </Badge>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              )}
            </Paper>

            <Paper p="md" radius="md" withBorder>
              <Group justify="space-between" mb="sm">
                <Text fw={600} size="sm">Batches On Hold</Text>
                <Anchor href="/qc/holds" size="xs">View holds →</Anchor>
              </Group>
              {holds.length === 0 ? (
                <Alert color="green" variant="light" icon={<IconCircleCheck size={14} />}>
                  No batches currently on hold.
                </Alert>
              ) : (
                <Table withTableBorder>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Batch</Table.Th>
                      <Table.Th>Qty</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {holds.map(b => (
                      <Table.Tr key={b.id} style={{ cursor: 'pointer' }} onClick={() => router.push(`/qc/inspect/${b.id}`)}>
                        <Table.Td><Text size="sm" style={{ fontFamily: 'monospace' }}>{b.batch_number}</Text></Table.Td>
                        <Table.Td><Text size="sm">{b.qty} {b.unit}</Text></Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              )}
            </Paper>
          </SimpleGrid>
        </>
      )}
    </Stack>
  );
}
