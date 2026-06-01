'use client';

import {
  SimpleGrid, Paper, Text, Title, Group, Stack, ThemeIcon,
  Anchor, Divider, Badge, Alert, Table, Box,
} from '@mantine/core';
import {
  IconTruckDelivery,
  IconAlertTriangle, IconClock, IconBuildingFactory, IconClipboardList,
  IconCircleCheck,
} from '@tabler/icons-react';
import { DashboardLoading } from '@/components/ui/dashboard-loading';
import { OperationalInsightPanel } from '@/components/ui/operational-dashboard';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface OverdueOrder { id: string; status: string; expected_arrival_date: string | null; ordered_qty: number; unit: string }
interface BlockedOrder { id: string; order_number: string; status: string; planned_qty: number; unit: string }
interface MaterialRequest {
  id: string;
  request_number: string;
  status: string;
  needed_date: string | null;
  priority: string | null;
}

interface RiskItem {
  label: string;
  value: number;
  description: string;
  color: string;
  href: string;
}

function RiskBreakdown({ risks }: { risks: RiskItem[] }) {
  const max = Math.max(...risks.map((risk) => risk.value), 1);
  const totalRisk = risks.reduce((sum, risk) => sum + risk.value, 0);

  return (
    <Paper p="md" radius="md" withBorder>
      <Group justify="space-between" align="flex-start" mb="md">
        <div>
          <Text fw={700} size="sm">Planning Risk Breakdown</Text>
          <Text size="xs" c="dimmed">
            What could delay the production plan today.
          </Text>
        </div>
        <Badge color={totalRisk > 0 ? 'red' : 'green'} variant="light">
          {totalRisk > 0 ? `${totalRisk} risks` : 'All clear'}
        </Badge>
      </Group>

      <Stack gap="sm">
        {risks.map((risk) => {
          const width = risk.value === 0 ? 0 : Math.max(10, Math.round((risk.value / max) * 100));
          return (
            <Anchor key={risk.label} href={risk.href} underline="never">
              <Box>
                <Group justify="space-between" mb={4} wrap="nowrap">
                  <Stack gap={0}>
                    <Text size="xs" fw={700} tt="uppercase" c="dimmed">{risk.label}</Text>
                    <Text size="xs" c="dimmed">{risk.description}</Text>
                  </Stack>
                  <Text fw={800} c={risk.value > 0 ? risk.color : 'dimmed'}>{risk.value}</Text>
                </Group>
                <Box h={6} style={{ borderRadius: 999, overflow: 'hidden', backgroundColor: '#E5E7EB' }}>
                  <Box
                    h="100%"
                    w={`${width}%`}
                    bg={risk.value > 0 ? `var(--mantine-color-${risk.color}-6)` : 'transparent'}
                    style={{ borderRadius: 999, transition: 'width 180ms ease' }}
                  />
                </Box>
              </Box>
            </Anchor>
          );
        })}
      </Stack>
    </Paper>
  );
}

export default function PPICDashboard() {
  const router = useRouter();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [overdueOrders, setOverdueOrders] = useState<OverdueOrder[]>([]);
  const [blockedOrders, setBlockedOrders] = useState<BlockedOrder[]>([]);
  const [pendingRequests, setPendingRequests] = useState<MaterialRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);

    async function load() {
      const [c, overdue, blocked, pending] = await Promise.all([
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

        fetch('/api/items/material_requests?filter[status][_eq]=submitted&fields[]=id&fields[]=request_number&fields[]=status&fields[]=needed_date&fields[]=priority&limit=5&sort[]=needed_date')
          .then(async r => r.ok ? (await r.json())?.data ?? [] : []).catch(() => []),
      ]);

      setCounts(c);
      setOverdueOrders(overdue);
      setBlockedOrders(blocked);
      setPendingRequests(pending);
      setLoading(false);
    }
    load();
  }, []);

  const n = (k: string) => counts[k] ?? 0;
  const ordersActive = n('ordersWaiting') + n('ordersPartial');
  const riskItems: RiskItem[] = [
    {
      label: 'Late supplier deliveries',
      value: n('ordersOverdue'),
      description: 'Purchase orders past expected arrival',
      color: 'orange',
      href: '/ppic/orders',
    },
    {
      label: 'Material shortages',
      value: n('prodBlocked'),
      description: 'Production blocked by missing materials',
      color: 'red',
      href: '/ppic/production',
    },
    {
      label: 'Requests waiting logistics',
      value: n('requestsPending'),
      description: 'Material requests not yet approved',
      color: 'blue',
      href: '/ppic/requests',
    },
    {
      label: 'Draft orders not released',
      value: n('prodDraft'),
      description: 'Planned orders still waiting to be released',
      color: 'gray',
      href: '/ppic/production',
    },
  ];
  const planningInsights = [
    n('prodBlocked') > 0
      ? {
          title: 'Material shortages are the first planning risk',
          description: `${n('prodBlocked')} production order${n('prodBlocked') === 1 ? '' : 's'} cannot move forward until required materials are available and approved.`,
          tone: 'risk' as const,
          href: '/ppic/production',
          action: 'Review orders',
        }
      : {
          title: 'No material shortage is blocking production',
          description: 'Released production can continue as long as warehouse issue and production handoff stay on time.',
          tone: 'good' as const,
          href: '/ppic/production',
          action: 'Monitor',
        },
    n('ordersOverdue') > 0
      ? {
          title: 'Late supplier deliveries may affect the next plan',
          description: `${n('ordersOverdue')} raw material order${n('ordersOverdue') === 1 ? ' is' : 's are'} past the expected arrival date. Check whether the material is needed by active production.`,
          tone: 'watch' as const,
          href: '/ppic/orders',
          action: 'Follow up',
        }
      : {
          title: 'Supplier deliveries are not overdue',
          description: 'Use the material readiness view before releasing more production orders.',
          tone: 'good' as const,
          href: '/ppic/orders',
          action: 'Plan ahead',
        },
    n('requestsPending') > 0
      ? {
          title: 'Logistics review is part of production readiness',
          description: `${n('requestsPending')} material request${n('requestsPending') === 1 ? ' is' : 's are'} waiting for logistics. Prioritize requests with the nearest needed date.`,
          tone: 'info' as const,
          href: '/ppic/requests',
          action: 'Coordinate',
        }
      : {
          title: 'No material requests are waiting for logistics',
          description: 'New production plans should still include a material check before release.',
          tone: 'good' as const,
          href: '/ppic/requests',
          action: 'Ready',
        },
  ];

  return (
    <Stack gap="lg">
      <div>
        <Title order={2}>PPIC Planning Dashboard</Title>
        <Text c="dimmed" size="sm">Track raw material supply, spot production risks, and keep upcoming production on schedule.</Text>
      </div>

      {loading ? <DashboardLoading cards={4} graphPanels={1} queuePanels={3} /> : (
        <>
          {/* ── Priority Cards ─────────────────────────────────────────────── */}
          <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
            <Paper p="md" radius="md" withBorder style={{ cursor: 'pointer' }} onClick={() => router.push('/ppic/orders')}>
              <Group justify="space-between" wrap="nowrap">
                <Stack gap={2}>
                  <Text size="xs" c="dimmed" fw={600} tt="uppercase">Orders Need Follow-Up</Text>
                  <Title order={2} c="blue">{ordersActive}</Title>
                  <Text size="xs" c="dimmed">Supplier orders still open or partly received</Text>
                </Stack>
                <ThemeIcon size="xl" radius="md" variant="light" color="blue"><IconTruckDelivery size={22} /></ThemeIcon>
              </Group>
            </Paper>

            <Paper p="md" radius="md" withBorder style={{ cursor: 'pointer', borderColor: n('prodBlocked') > 0 ? 'var(--mantine-color-red-5)' : undefined }} onClick={() => router.push('/ppic/production')}>
              <Group justify="space-between" wrap="nowrap">
                <Stack gap={2}>
                  <Text size="xs" c="dimmed" fw={600} tt="uppercase">Material Shortages</Text>
                  <Title order={2} c={n('prodBlocked') > 0 ? 'red' : undefined}>{n('prodBlocked')}</Title>
                  <Text size="xs" c="dimmed">Production orders waiting for materials</Text>
                </Stack>
                <ThemeIcon size="xl" radius="md" variant={n('prodBlocked') > 0 ? 'filled' : 'light'} color="red"><IconAlertTriangle size={22} /></ThemeIcon>
              </Group>
            </Paper>

            <Paper p="md" radius="md" withBorder style={{ cursor: 'pointer', borderColor: n('ordersOverdue') > 0 ? 'var(--mantine-color-orange-5)' : undefined }} onClick={() => router.push('/ppic/orders')}>
              <Group justify="space-between" wrap="nowrap">
                <Stack gap={2}>
                  <Text size="xs" c="dimmed" fw={600} tt="uppercase">Late Deliveries</Text>
                  <Title order={2} c={n('ordersOverdue') > 0 ? 'orange' : undefined}>{n('ordersOverdue')}</Title>
                  <Text size="xs" c="dimmed">Supplier deliveries past expected date</Text>
                </Stack>
                <ThemeIcon size="xl" radius="md" variant={n('ordersOverdue') > 0 ? 'filled' : 'light'} color="orange"><IconClock size={22} /></ThemeIcon>
              </Group>
            </Paper>

            <Paper p="md" radius="md" withBorder style={{ cursor: 'pointer' }} onClick={() => router.push('/ppic/requests')}>
              <Group justify="space-between" wrap="nowrap">
                <Stack gap={2}>
                  <Text size="xs" c="dimmed" fw={600} tt="uppercase">Requests Waiting for Logistics</Text>
                  <Title order={2} c={n('requestsPending') > 0 ? 'grape' : undefined}>{n('requestsPending')}</Title>
                  <Text size="xs" c="dimmed">Material requests waiting for review</Text>
                </Stack>
                <ThemeIcon size="xl" radius="md" variant={n('requestsPending') > 0 ? 'filled' : 'light'} color="blue"><IconClipboardList size={22} /></ThemeIcon>
              </Group>
            </Paper>
          </SimpleGrid>

          <OperationalInsightPanel
            title="Planning Insights"
            subtitle="Decision support for schedule risk, material readiness, and handoffs."
            items={planningInsights}
          />

          {/* Planning graph: only shows risks not already visible as detailed rows below */}
          <RiskBreakdown risks={riskItems} />

          {/* Exception queues */}
          <Divider label="Exceptions Needing Attention" labelPosition="left" />
          <SimpleGrid cols={{ base: 1, lg: 3 }} spacing="md">
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

            <Paper p="md" radius="md" withBorder>
              <Group justify="space-between" mb="sm">
                <Text fw={600} size="sm">Requests Waiting for Logistics</Text>
                <Anchor href="/ppic/requests" size="xs">View all →</Anchor>
              </Group>
              {pendingRequests.length === 0 ? (
                <Alert color="green" variant="light" icon={<IconCircleCheck size={14} />}>
                  No material requests are waiting for logistics review.
                </Alert>
              ) : (
                <Table withTableBorder>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Request</Table.Th>
                      <Table.Th>Needed</Table.Th>
                      <Table.Th>Priority</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {pendingRequests.map((request) => (
                      <Table.Tr key={request.id} style={{ cursor: 'pointer' }} onClick={() => router.push(`/ppic/requests/${request.id}`)}>
                        <Table.Td><Text size="sm" fw={500}>{request.request_number}</Text></Table.Td>
                        <Table.Td><Text size="sm">{request.needed_date ? new Date(request.needed_date).toLocaleDateString() : '—'}</Text></Table.Td>
                        <Table.Td><Badge size="xs" color="blue" variant="light">{request.priority ?? 'normal'}</Badge></Table.Td>
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
