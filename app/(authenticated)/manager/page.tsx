'use client';

import {
  SimpleGrid, Paper, Text, Title, Group, Stack, ThemeIcon,
  Anchor, Divider, Badge, Alert, Table,
} from '@mantine/core';
import { BarChart } from '@mantine/charts';
import {
  IconAlertTriangle, IconCheck, IconClock, IconChevronRight,
  IconBuildingFactory, IconFlask, IconTruckDelivery, IconPackage,
  IconCircleCheck, IconX,
} from '@tabler/icons-react';
import { DashboardLoading } from '@/components/ui/dashboard-loading';
import { OperationalInsightPanel } from '@/components/ui/operational-dashboard';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// ── Types ───────────────────────────────────────────────────────────────────

interface HoldBatch { id: string; batch_number: string; status: string; material_id: string }
interface LateOrder { id: string; status: string; expected_arrival_date: string | null; material_id: string }

// ── Dashboard ────────────────────────────────────────────────────────────────

export default function ManagerDashboard() {
  const router = useRouter();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [holdBatches, setHoldBatches] = useState<HoldBatch[]>([]);
  const [lateOrders, setLateOrders] = useState<LateOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);

    async function load() {
      const [c, holds, late] = await Promise.all([
        fetch('/api/batch-counts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            counts: [
              { key: 'ordersOrdered', collection: 'raw_material_orders', filter: { status: { _eq: 'ordered' } } },
              { key: 'ordersPartial', collection: 'raw_material_orders', filter: { status: { _eq: 'partially_received' } } },
              { key: 'ordersOverdue', collection: 'raw_material_orders', filter: { status: { _in: ['ordered', 'partially_received'] }, expected_arrival_date: { _lt: today } } },
              { key: 'batchesQcPending', collection: 'batches', filter: { status: { _eq: 'qc_pending' } } },
              { key: 'batchesUnderQc', collection: 'batches', filter: { status: { _eq: 'under_qc' } } },
              { key: 'batchesHold', collection: 'batches', filter: { status: { _eq: 'hold' } } },
              { key: 'batchesRejected', collection: 'batches', filter: { status: { _eq: 'rejected' } } },
              { key: 'batchesStored', collection: 'batches', filter: { status: { _eq: 'stored_available' } } },
              { key: 'prodBlocked', collection: 'production_orders', filter: { status: { _eq: 'waiting_issue' } } },
              { key: 'prodReady', collection: 'production_orders', filter: { status: { _eq: 'released' } } },
              { key: 'prodActive', collection: 'production_orders', filter: { status: { _eq: 'in_progress' } } },
              { key: 'prodCompleted', collection: 'production_orders', filter: { status: { _eq: 'completed' } } },
            ],
          }),
        }).then(async r => r.ok ? (await r.json())?.counts ?? {} : {}).catch(() => ({})),

        fetch('/api/items/batches?filter[status][_in]=hold,rejected&fields[]=id&fields[]=batch_number&fields[]=status&fields[]=material_id&limit=6&sort[]=-id')
          .then(async r => r.ok ? (await r.json())?.data ?? [] : []).catch(() => []),

        fetch(`/api/items/raw_material_orders?filter[status][_in]=ordered,partially_received&filter[expected_arrival_date][_lt]=${today}&fields[]=id&fields[]=status&fields[]=expected_arrival_date&fields[]=material_id&limit=6&sort[]=expected_arrival_date`)
          .then(async r => r.ok ? (await r.json())?.data ?? [] : []).catch(() => []),
      ]);

      setCounts(c);
      setHoldBatches(holds);
      setLateOrders(late);
      setLoading(false);
    }
    load();
  }, []);

  const n = (k: string) => counts[k] ?? 0;
  const qcIssues = n('batchesHold') + n('batchesRejected');
  const managerInsights = [
    n('prodBlocked') > 0
      ? {
          title: 'Main production risk is material availability',
          description: `${n('prodBlocked')} production order${n('prodBlocked') === 1 ? ' is' : 's are'} blocked. Escalate PPIC, logistics, and warehouse coordination before the schedule slips.`,
          tone: 'risk' as const,
          href: '/ppic/production',
          action: 'Escalate',
        }
      : {
          title: 'Production is not blocked by materials',
          description: 'No production order is currently waiting for material availability.',
          tone: 'good' as const,
          href: '/production/active',
          action: 'Monitor',
        },
    qcIssues > 0
      ? {
          title: 'Quality exceptions need management visibility',
          description: `${qcIssues} batch${qcIssues === 1 ? ' is' : 'es are'} on hold or rejected. Confirm owner, decision notes, and downstream impact.`,
          tone: 'watch' as const,
          href: '/manager/qc',
          action: 'Review QC',
        }
      : {
          title: 'No quality exception is open',
          description: 'There are no held or rejected batches creating visible release risk right now.',
          tone: 'good' as const,
          href: '/manager/qc',
          action: 'Stable',
        },
    n('ordersOverdue') > 0
      ? {
          title: 'Late deliveries can become production blockers',
          description: `${n('ordersOverdue')} supplier delivery${n('ordersOverdue') === 1 ? ' is' : 'ies are'} overdue. Ask PPIC whether the delayed material is tied to active production.`,
          tone: 'watch' as const,
          href: '/ppic/orders',
          action: 'Follow up',
        }
      : {
          title: 'Supplier delivery timing looks healthy',
          description: 'No raw material order is past its expected arrival date.',
          tone: 'good' as const,
          href: '/ppic/orders',
          action: 'All clear',
        },
  ];

  return (
    <Stack gap="lg">
      <div>
        <Title order={2}>Operations Overview</Title>
        <Text c="dimmed" size="sm">Cross-department view — surface blockers, quality issues, and overdue work before they impact production.</Text>
      </div>

      {loading ? <DashboardLoading cards={4} graphPanels={1} queuePanels={2} /> : (
        <>
          {/* ── Priority Cards ─────────────────────────────────────────────── */}
          <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
            <Paper
              p="md" radius="md" withBorder className="role-clickable-card" style={{ cursor: 'pointer', borderColor: n('prodBlocked') > 0 ? 'var(--mantine-color-red-5)' : undefined }}
              onClick={() => router.push('/ppic/production')}
            >
              <Group justify="space-between" wrap="nowrap">
                <Stack gap={2}>
                  <Text size="xs" c="dimmed" fw={600} tt="uppercase">Production Blocked</Text>
                  <Title order={2} c={n('prodBlocked') > 0 ? 'red' : undefined}>{n('prodBlocked')}</Title>
                  <Text size="xs" c="dimmed">Orders waiting for materials</Text>
                </Stack>
                <ThemeIcon size="xl" radius="md" variant={n('prodBlocked') > 0 ? 'filled' : 'light'} color="red">
                  <IconAlertTriangle size={22} />
                </ThemeIcon>
              </Group>
            </Paper>

            <Paper
              p="md" radius="md" withBorder className="role-clickable-card" style={{ cursor: 'pointer', borderColor: qcIssues > 0 ? 'var(--mantine-color-orange-5)' : undefined }}
              onClick={() => router.push('/manager/qc')}
            >
              <Group justify="space-between" wrap="nowrap">
                <Stack gap={2}>
                  <Text size="xs" c="dimmed" fw={600} tt="uppercase">Quality Issues</Text>
                  <Title order={2} c={qcIssues > 0 ? 'orange' : undefined}>{qcIssues}</Title>
                  <Text size="xs" c="dimmed">Batches on hold or rejected</Text>
                </Stack>
                <ThemeIcon size="xl" radius="md" variant={qcIssues > 0 ? 'filled' : 'light'} color="orange">
                  <IconFlask size={22} />
                </ThemeIcon>
              </Group>
            </Paper>

            <Paper
              p="md" radius="md" withBorder className="role-clickable-card" style={{ cursor: 'pointer', borderColor: n('ordersOverdue') > 0 ? 'var(--mantine-color-orange-5)' : undefined }}
              onClick={() => router.push('/ppic/orders')}
            >
              <Group justify="space-between" wrap="nowrap">
                <Stack gap={2}>
                  <Text size="xs" c="dimmed" fw={600} tt="uppercase">Deliveries Overdue</Text>
                  <Title order={2} c={n('ordersOverdue') > 0 ? 'orange' : undefined}>{n('ordersOverdue')}</Title>
                  <Text size="xs" c="dimmed">Orders past expected arrival</Text>
                </Stack>
                <ThemeIcon size="xl" radius="md" variant={n('ordersOverdue') > 0 ? 'filled' : 'light'} color="orange">
                  <IconTruckDelivery size={22} />
                </ThemeIcon>
              </Group>
            </Paper>

            <Paper
              p="md" radius="md" withBorder className="role-clickable-card" style={{ cursor: 'pointer' }}
              onClick={() => router.push('/production/active')}
            >
              <Group justify="space-between" wrap="nowrap">
                <Stack gap={2}>
                  <Text size="xs" c="dimmed" fw={600} tt="uppercase">Currently Running</Text>
                  <Title order={2} c="blue">{n('prodActive')}</Title>
                  <Text size="xs" c="dimmed">Production orders active</Text>
                </Stack>
                <ThemeIcon size="xl" radius="md" variant="light" color="blue">
                  <IconBuildingFactory size={22} />
                </ThemeIcon>
              </Group>
            </Paper>
          </SimpleGrid>

          <OperationalInsightPanel
            title="Manager Planning Insights"
            subtitle="Cross-role risks, likely bottlenecks, and the next owner to check."
            items={managerInsights}
          />

          {/* ── Operations Pipeline ─────────────────────────────────────────── */}
          <Paper p="md" radius="md" withBorder>
            <Text fw={600} size="sm" mb="sm">End-to-End Operations Pipeline</Text>
            <BarChart
              h={180}
              data={[
                { stage: 'On Order', count: n('ordersOrdered') + n('ordersPartial') },
                { stage: 'In QC', count: n('batchesQcPending') + n('batchesUnderQc') },
                { stage: 'Stored & Ready', count: n('batchesStored') },
                { stage: 'In Production', count: n('prodActive') },
                { stage: 'Completed', count: n('prodCompleted') },
              ]}
              dataKey="stage"
              series={[{ name: 'count', label: 'Count', color: 'blue.6' }]}
              withLegend={false}
            />
            <Text size="xs" c="dimmed" mt="xs">Larger numbers in early stages = upstream bottleneck. Ideal: even or growing toward right.</Text>
          </Paper>

          {/* ── Exception Queues ────────────────────────────────────────────── */}
          <Divider label="Exceptions Needing Attention" labelPosition="left" />
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            {/* QC holds/rejections */}
            <Paper p="md" radius="md" withBorder>
              <Group justify="space-between" mb="sm">
                <Text fw={600} size="sm">Quality Issues</Text>
                <Anchor href="/manager/qc" size="xs">View all →</Anchor>
              </Group>
              {holdBatches.length === 0 ? (
                <Alert color="green" variant="light" icon={<IconCircleCheck size={14} />}>
                  No batches on hold or rejected right now.
                </Alert>
              ) : (
                <Table withTableBorder>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Batch</Table.Th>
                      <Table.Th>Status</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {holdBatches.slice(0, 5).map(b => (
                      <Table.Tr key={b.id}>
                        <Table.Td><Text size="sm" style={{ fontFamily: 'monospace' }}>{b.batch_number}</Text></Table.Td>
                        <Table.Td>
                          <Badge size="xs" color={b.status === 'hold' ? 'yellow' : 'red'} variant="light">
                            {b.status === 'hold' ? 'On Hold' : 'Rejected'}
                          </Badge>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              )}
            </Paper>

            {/* Late deliveries */}
            <Paper p="md" radius="md" withBorder>
              <Group justify="space-between" mb="sm">
                <Text fw={600} size="sm">Overdue Deliveries</Text>
                <Anchor href="/ppic/orders" size="xs">View all →</Anchor>
              </Group>
              {lateOrders.length === 0 ? (
                <Alert color="green" variant="light" icon={<IconCircleCheck size={14} />}>
                  All deliveries are on track.
                </Alert>
              ) : (
                <Table withTableBorder>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Expected By</Table.Th>
                      <Table.Th>Status</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {lateOrders.slice(0, 5).map(o => (
                      <Table.Tr key={o.id}>
                        <Table.Td>
                          <Text size="sm">{o.expected_arrival_date ? new Date(o.expected_arrival_date).toLocaleDateString() : '—'}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge size="xs" color="orange" variant="light">
                            {o.status === 'ordered' ? 'Not yet received' : 'Partially received'}
                          </Badge>
                        </Table.Td>
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
