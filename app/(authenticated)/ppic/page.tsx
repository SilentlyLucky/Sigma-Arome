'use client';

import {
  SimpleGrid, Paper, Text, Title, Group, Stack, ThemeIcon,
  Loader, Anchor, Divider, Badge, Alert, Table,
} from '@mantine/core';
import { DonutChart } from '@mantine/charts';
import {
  IconShoppingCart, IconTruckDelivery, IconFlask, IconCheck,
  IconAlertTriangle, IconClock, IconBuildingFactory, IconClipboardList,
  IconCircleCheck, IconChevronRight,
} from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface OverdueOrder { id: string; status: string; expected_arrival_date: string | null; ordered_qty: number; unit: string }
interface BlockedOrder { id: string; order_number: string; status: string; planned_qty: number; unit: string }

export default function PPICDashboard() {
  const router = useRouter();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [overdueOrders, setOverdueOrders] = useState<OverdueOrder[]>([]);
  const [blockedOrders, setBlockedOrders] = useState<BlockedOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);

    async function load() {
      const [c, overdue, blocked] = await Promise.all([
        fetch('/api/batch-counts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            counts: [
              { key: 'ordersWaiting', collection: 'raw_material_orders', filter: { status: { _eq: 'ordered' } } },
              { key: 'ordersPartial', collection: 'raw_material_orders', filter: { status: { _eq: 'partially_received' } } },
              { key: 'ordersOverdue', collection: 'raw_material_orders', filter: { status: { _in: ['ordered', 'partially_received'] }, expected_arrival_date: { _lt: today } } },
              { key: 'prodDraft', collection: 'production_orders', filter: { status: { _eq: 'draft' } } },
              { key: 'prodBlocked', collection: 'production_orders', filter: { status: { _eq: 'waiting_issue' } } },
              { key: 'prodReady', collection: 'production_orders', filter: { status: { _eq: 'released' } } },
              { key: 'prodActive', collection: 'production_orders', filter: { status: { _eq: 'in_progress' } } },
              { key: 'requestsPending', collection: 'material_requests', filter: { status: { _eq: 'submitted' } } },
            ],
          }),
        }).then(async r => r.ok ? (await r.json())?.counts ?? {} : {}).catch(() => ({})),

        fetch(`/api/items/raw_material_orders?filter[status][_in]=ordered,partially_received&filter[expected_arrival_date][_lt]=${today}&fields[]=id&fields[]=status&fields[]=expected_arrival_date&fields[]=ordered_qty&fields[]=unit&limit=5&sort[]=expected_arrival_date`)
          .then(async r => r.ok ? (await r.json())?.data ?? [] : []).catch(() => []),

        fetch('/api/items/production_orders?filter[status][_eq]=waiting_issue&fields[]=id&fields[]=order_number&fields[]=status&fields[]=planned_qty&fields[]=unit&limit=5&sort[]=-id')
          .then(async r => r.ok ? (await r.json())?.data ?? [] : []).catch(() => []),
      ]);

      setCounts(c);
      setOverdueOrders(overdue);
      setBlockedOrders(blocked);
      setLoading(false);
    }
    load();
  }, []);

  const n = (k: string) => counts[k] ?? 0;
  const ordersActive = n('ordersWaiting') + n('ordersPartial');

  return (
    <Stack gap="lg">
      <div>
        <Title order={2}>PPIC Planning Dashboard</Title>
        <Text c="dimmed" size="sm">Plan orders, monitor formulas, check material availability, and keep production on schedule.</Text>
      </div>

      {loading ? <Group justify="center" py="xl"><Loader /></Group> : (
        <>
          {/* ── Priority Cards ─────────────────────────────────────────────── */}
          <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
            <Paper p="md" radius="md" withBorder style={{ cursor: 'pointer' }} onClick={() => router.push('/ppic/orders')}>
              <Group justify="space-between" wrap="nowrap">
                <Stack gap={2}>
                  <Text size="xs" c="dimmed" fw={600} tt="uppercase">Orders to Follow Up</Text>
                  <Title order={2} c="blue">{ordersActive}</Title>
                  <Text size="xs" c="dimmed">Orders ordered or partially received</Text>
                </Stack>
                <ThemeIcon size="xl" radius="md" variant="light" color="blue"><IconTruckDelivery size={22} /></ThemeIcon>
              </Group>
            </Paper>

            <Paper p="md" radius="md" withBorder style={{ cursor: 'pointer', borderColor: n('prodBlocked') > 0 ? 'var(--mantine-color-red-5)' : undefined }} onClick={() => router.push('/ppic/production')}>
              <Group justify="space-between" wrap="nowrap">
                <Stack gap={2}>
                  <Text size="xs" c="dimmed" fw={600} tt="uppercase">Production Blocked</Text>
                  <Title order={2} c={n('prodBlocked') > 0 ? 'red' : undefined}>{n('prodBlocked')}</Title>
                  <Text size="xs" c="dimmed">Orders waiting for materials</Text>
                </Stack>
                <ThemeIcon size="xl" radius="md" variant={n('prodBlocked') > 0 ? 'filled' : 'light'} color="red"><IconAlertTriangle size={22} /></ThemeIcon>
              </Group>
            </Paper>

            <Paper p="md" radius="md" withBorder style={{ cursor: 'pointer', borderColor: n('ordersOverdue') > 0 ? 'var(--mantine-color-orange-5)' : undefined }} onClick={() => router.push('/ppic/orders')}>
              <Group justify="space-between" wrap="nowrap">
                <Stack gap={2}>
                  <Text size="xs" c="dimmed" fw={600} tt="uppercase">Deliveries Overdue</Text>
                  <Title order={2} c={n('ordersOverdue') > 0 ? 'orange' : undefined}>{n('ordersOverdue')}</Title>
                  <Text size="xs" c="dimmed">Past expected arrival date</Text>
                </Stack>
                <ThemeIcon size="xl" radius="md" variant={n('ordersOverdue') > 0 ? 'filled' : 'light'} color="orange"><IconClock size={22} /></ThemeIcon>
              </Group>
            </Paper>

            <Paper p="md" radius="md" withBorder style={{ cursor: 'pointer' }} onClick={() => router.push('/ppic/requests')}>
              <Group justify="space-between" wrap="nowrap">
                <Stack gap={2}>
                  <Text size="xs" c="dimmed" fw={600} tt="uppercase">Requests Waiting</Text>
                  <Title order={2} c={n('requestsPending') > 0 ? 'grape' : undefined}>{n('requestsPending')}</Title>
                  <Text size="xs" c="dimmed">Material requests pending logistics</Text>
                </Stack>
                <ThemeIcon size="xl" radius="md" variant={n('requestsPending') > 0 ? 'filled' : 'light'} color="grape"><IconClipboardList size={22} /></ThemeIcon>
              </Group>
            </Paper>
          </SimpleGrid>

          {/* ── Status Breakdowns ───────────────────────────────────────────── */}
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <Paper p="md" radius="md" withBorder>
              <Text fw={600} size="sm" mb="sm">Material Order Status</Text>
              <DonutChart
                data={[
                  { name: 'Ordered', value: n('ordersWaiting'), color: 'blue.5' },
                  { name: 'Partially received', value: n('ordersPartial'), color: 'yellow.5' },
                ]}
                size={160}
                thickness={30}
                withLabels
                withLabelsLine={false}
              />
              <Anchor href="/ppic/orders" size="xs" mt="xs" display="block">Manage orders →</Anchor>
            </Paper>
            <Paper p="md" radius="md" withBorder>
              <Text fw={600} size="sm" mb="sm">Production Readiness</Text>
              <DonutChart
                data={[
                  { name: 'Draft / planning', value: n('prodDraft'), color: 'gray.5' },
                  { name: 'Waiting for materials', value: n('prodBlocked'), color: 'red.5' },
                  { name: 'Ready to start', value: n('prodReady'), color: 'lime.5' },
                  { name: 'Running', value: n('prodActive'), color: 'violet.5' },
                ]}
                size={160}
                thickness={30}
                withLabels
                withLabelsLine={false}
              />
              <Anchor href="/ppic/production" size="xs" mt="xs" display="block">View production orders →</Anchor>
            </Paper>
          </SimpleGrid>

          {/* ── Exception Queues ────────────────────────────────────────────── */}
          <Divider label="Exceptions Needing Attention" labelPosition="left" />
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <Paper p="md" radius="md" withBorder>
              <Group justify="space-between" mb="sm">
                <Text fw={600} size="sm">Overdue Deliveries</Text>
                <Anchor href="/ppic/orders" size="xs">View all →</Anchor>
              </Group>
              {overdueOrders.length === 0 ? (
                <Alert color="green" variant="light" icon={<IconCircleCheck size={14} />}>
                  All deliveries are on schedule.
                </Alert>
              ) : (
                <Table withTableBorder>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Expected By</Table.Th>
                      <Table.Th>Qty</Table.Th>
                      <Table.Th>Status</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {overdueOrders.map(o => (
                      <Table.Tr key={o.id}>
                        <Table.Td><Text size="sm">{o.expected_arrival_date ? new Date(o.expected_arrival_date).toLocaleDateString() : '—'}</Text></Table.Td>
                        <Table.Td><Text size="sm">{o.ordered_qty} {o.unit}</Text></Table.Td>
                        <Table.Td><Badge size="xs" color="orange" variant="light">{o.status === 'ordered' ? 'Not yet received' : 'Partial'}</Badge></Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              )}
            </Paper>

            <Paper p="md" radius="md" withBorder>
              <Group justify="space-between" mb="sm">
                <Text fw={600} size="sm">Production Blocked by Materials</Text>
                <Anchor href="/ppic/production" size="xs">View all →</Anchor>
              </Group>
              {blockedOrders.length === 0 ? (
                <Alert color="green" variant="light" icon={<IconCircleCheck size={14} />}>
                  No production orders are blocked right now.
                </Alert>
              ) : (
                <Table withTableBorder>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Order</Table.Th>
                      <Table.Th>Quantity</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {blockedOrders.map(o => (
                      <Table.Tr key={o.id} style={{ cursor: 'pointer' }} onClick={() => router.push(`/ppic/production/${o.id}`)}>
                        <Table.Td><Text size="sm" fw={500}>{o.order_number}</Text></Table.Td>
                        <Table.Td><Text size="sm">{o.planned_qty} {o.unit}</Text></Table.Td>
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
