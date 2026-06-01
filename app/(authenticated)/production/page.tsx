'use client';

import {
  SimpleGrid, Paper, Text, Title, Group, Stack, ThemeIcon,
  Anchor, Divider, Badge, Alert, Table,
} from '@mantine/core';
import {
  IconPlayerPlay, IconClock, IconCheck, IconPackage,
  IconAlertTriangle, IconCircleCheck,
} from '@tabler/icons-react';
import { DashboardLoading } from '@/components/ui/dashboard-loading';
import { OperationalInsightPanel } from '@/components/ui/operational-dashboard';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface ProductionOrder {
  id: string;
  order_number: string;
  status: string;
  planned_qty: number;
  unit: string;
  due_date: string | null;
}

export default function ProductionDashboard() {
  const router = useRouter();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [readyOrders, setReadyOrders] = useState<ProductionOrder[]>([]);
  const [activeOrders, setActiveOrders] = useState<ProductionOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [c, ready, active] = await Promise.all([
        fetch('/api/batch-counts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            counts: [
              { key: 'ready', collection: 'production_orders', filter: { status: { _eq: 'released' } } },
              { key: 'inProgress', collection: 'production_orders', filter: { status: { _eq: 'in_progress' } } },
              { key: 'blocked', collection: 'production_orders', filter: { status: { _eq: 'waiting_issue' } } },
              { key: 'completed', collection: 'production_orders', filter: { status: { _eq: 'completed' } } },
              { key: 'fgWaitingQc', collection: 'batches', filter: { batch_type: { _eq: 'finished_product' }, status: { _eq: 'qc_pending' } } },
              { key: 'fgApproved', collection: 'batches', filter: { batch_type: { _eq: 'finished_product' }, status: { _eq: 'approved' } } },
            ],
          }),
        }).then(async r => r.ok ? (await r.json())?.counts ?? {} : {}).catch(() => ({})),

        fetch('/api/items/production_orders?filter[status][_eq]=released&fields[]=id&fields[]=order_number&fields[]=status&fields[]=planned_qty&fields[]=unit&fields[]=due_date&limit=6&sort[]=due_date')
          .then(async r => r.ok ? (await r.json())?.data ?? [] : []).catch(() => []),

        fetch('/api/items/production_orders?filter[status][_eq]=in_progress&fields[]=id&fields[]=order_number&fields[]=status&fields[]=planned_qty&fields[]=unit&fields[]=due_date&limit=6&sort[]=due_date')
          .then(async r => r.ok ? (await r.json())?.data ?? [] : []).catch(() => []),
      ]);

      setCounts(c);
      setReadyOrders(ready);
      setActiveOrders(active);
      setLoading(false);
    }
    load();
  }, []);

  const n = (k: string) => counts[k] ?? 0;
  const fgWaiting = n('fgWaitingQc') + n('fgApproved');
  const productionInsights = [
    n('inProgress') > 0
      ? {
          title: 'Active orders need progress and completion discipline',
          description: `${n('inProgress')} production order${n('inProgress') === 1 ? ' is' : 's are'} running. Keep stage notes, actual consumption, and output records current.`,
          tone: 'info' as const,
          href: '/production/active',
          action: 'Update work',
        }
      : {
          title: 'No order is currently running',
          description: 'Wait for warehouse handoff or review released orders that are available for production.',
          tone: 'good' as const,
          href: '/production/orders',
          action: 'Monitor',
        },
    n('ready') > 0
      ? {
          title: 'Released orders are available to prepare',
          description: `${n('ready')} released order${n('ready') === 1 ? ' is' : 's are'} available. Confirm materials are issued before recording execution.`,
          tone: 'watch' as const,
          href: '/production/orders',
          action: 'Prepare',
        }
      : {
          title: 'No released order is waiting on production',
          description: 'There is no new production order ready for the production team right now.',
          tone: 'good' as const,
          href: '/production/orders',
          action: 'Stable',
        },
    fgWaiting > 0
      ? {
          title: 'Finished goods still need downstream release',
          description: `${fgWaiting} finished goods batch${fgWaiting === 1 ? ' is' : 'es are'} waiting for QC or storage. This affects when output becomes available.`,
          tone: 'info' as const,
          href: '/production/completed',
          action: 'Track output',
        }
      : {
          title: 'No finished goods handoff is waiting',
          description: 'Completed output has no visible QC or storage wait from this dashboard.',
          tone: 'good' as const,
          href: '/production/completed',
          action: 'All clear',
        },
  ];

  return (
    <Stack gap="lg">
      <div>
        <Title order={2}>Production Workbench</Title>
        <Text c="dimmed" size="sm">Work production orders, keep execution records current, and confirm finished output.</Text>
      </div>

      {loading ? <DashboardLoading cards={4} graphPanels={0} queuePanels={2} /> : (
        <>
          {/* ── Priority Cards ─────────────────────────────────────────────── */}
          <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
            <Paper p="md" radius="md" withBorder className="role-clickable-card" style={{ cursor: 'pointer', borderColor: n('ready') > 0 ? 'var(--mantine-color-green-4)' : undefined }} onClick={() => router.push('/production/orders')}>
              <Group justify="space-between" wrap="nowrap">
                <Stack gap={2}>
                  <Text size="xs" c="dimmed" fw={600} tt="uppercase">Released to Production</Text>
                  <Title order={2} c={n('ready') > 0 ? 'green' : undefined}>{n('ready')}</Title>
                  <Text size="xs" c="dimmed">Orders available after planning release</Text>
                </Stack>
                <ThemeIcon size="xl" radius="md" variant={n('ready') > 0 ? 'filled' : 'light'} color="green"><IconPlayerPlay size={22} /></ThemeIcon>
              </Group>
            </Paper>

            <Paper p="md" radius="md" withBorder className="role-clickable-card" style={{ cursor: 'pointer' }} onClick={() => router.push('/production/active')}>
              <Group justify="space-between" wrap="nowrap">
                <Stack gap={2}>
                  <Text size="xs" c="dimmed" fw={600} tt="uppercase">Currently Running</Text>
                  <Title order={2} c="blue">{n('inProgress')}</Title>
                  <Text size="xs" c="dimmed">Orders in production</Text>
                </Stack>
                <ThemeIcon size="xl" radius="md" variant="light" color="blue"><IconClock size={22} /></ThemeIcon>
              </Group>
            </Paper>

            <Paper p="md" radius="md" withBorder className="role-clickable-card" style={{ cursor: 'pointer', borderColor: fgWaiting > 0 ? 'var(--mantine-color-orange-4)' : undefined }} onClick={() => router.push('/logistic/fg-putaway')}>
              <Group justify="space-between" wrap="nowrap">
                <Stack gap={2}>
                  <Text size="xs" c="dimmed" fw={600} tt="uppercase">Finished Goods Waiting</Text>
                  <Title order={2} c={fgWaiting > 0 ? 'orange' : undefined}>{fgWaiting}</Title>
                  <Text size="xs" c="dimmed">Waiting for QC or storage</Text>
                </Stack>
                <ThemeIcon size="xl" radius="md" variant={fgWaiting > 0 ? 'filled' : 'light'} color="orange"><IconPackage size={22} /></ThemeIcon>
              </Group>
            </Paper>

            <Paper p="md" radius="md" withBorder className="role-clickable-card" style={{ cursor: 'pointer', borderColor: n('blocked') > 0 ? 'var(--mantine-color-red-4)' : undefined }} onClick={() => router.push('/ppic/production')}>
              <Group justify="space-between" wrap="nowrap">
                <Stack gap={2}>
                  <Text size="xs" c="dimmed" fw={600} tt="uppercase">Blocked by Materials</Text>
                  <Title order={2} c={n('blocked') > 0 ? 'red' : undefined}>{n('blocked')}</Title>
                  <Text size="xs" c="dimmed">Orders waiting for supply</Text>
                </Stack>
                <ThemeIcon size="xl" radius="md" variant={n('blocked') > 0 ? 'filled' : 'light'} color="red"><IconAlertTriangle size={22} /></ThemeIcon>
              </Group>
            </Paper>
          </SimpleGrid>

          <OperationalInsightPanel
            title="Production Planning Insights"
            subtitle="Keep execution, material handoff, and finished output aligned."
            items={productionInsights}
          />

          {/* ── Work Queues ─────────────────────────────────────────────────── */}
          <Divider label="Work Queue" labelPosition="left" />
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <Paper p="md" radius="md" withBorder>
              <Group justify="space-between" mb="sm">
                <Text fw={600} size="sm">Released to Production</Text>
                <Anchor href="/production/orders" size="xs">View all →</Anchor>
              </Group>
              {readyOrders.length === 0 ? (
                <Alert color="blue" variant="light" icon={<IconCircleCheck size={14} />}>
                  No released orders are waiting on production right now.
                </Alert>
              ) : (
                <Table withTableBorder>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Order</Table.Th>
                      <Table.Th>Quantity</Table.Th>
                      <Table.Th>Due</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {readyOrders.map(o => (
                      <Table.Tr key={o.id} style={{ cursor: 'pointer' }} onClick={() => router.push(`/production/orders/${o.id}`)}>
                        <Table.Td><Text size="sm" fw={500}>{o.order_number}</Text></Table.Td>
                        <Table.Td><Text size="sm">{o.planned_qty} {o.unit}</Text></Table.Td>
                        <Table.Td><Text size="sm">{o.due_date ? new Date(o.due_date).toLocaleDateString() : '—'}</Text></Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              )}
            </Paper>

            <Paper p="md" radius="md" withBorder>
              <Group justify="space-between" mb="sm">
                <Text fw={600} size="sm">Currently Running</Text>
                <Anchor href="/production/active" size="xs">View all →</Anchor>
              </Group>
              {activeOrders.length === 0 ? (
                <Alert color="blue" variant="light" icon={<IconCircleCheck size={14} />}>
                  No orders are currently in production.
                </Alert>
              ) : (
                <Table withTableBorder>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Order</Table.Th>
                      <Table.Th>Quantity</Table.Th>
                      <Table.Th>Due</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {activeOrders.map(o => (
                      <Table.Tr key={o.id} style={{ cursor: 'pointer' }} onClick={() => router.push(`/production/orders/${o.id}`)}>
                        <Table.Td><Text size="sm" fw={500}>{o.order_number}</Text></Table.Td>
                        <Table.Td><Text size="sm">{o.planned_qty} {o.unit}</Text></Table.Td>
                        <Table.Td>
                          {o.due_date ? (
                            <Badge size="xs" color={new Date(o.due_date) < new Date() ? 'red' : 'blue'} variant="light">
                              {new Date(o.due_date).toLocaleDateString()}
                            </Badge>
                          ) : <Text size="sm">—</Text>}
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
