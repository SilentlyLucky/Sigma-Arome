'use client';

import {
  SimpleGrid, Paper, Text, Title, Group, Stack, ThemeIcon,
  Loader, Anchor, Divider, Badge, Alert, Table,
} from '@mantine/core';
import {
  IconAlertTriangle, IconCheck, IconClock, IconChevronRight,
  IconBuildingFactory, IconFlask, IconTruckDelivery, IconPackage,
  IconCircleCheck, IconX,
} from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import React from 'react';
import { useRouter } from 'next/navigation';

// ── Shared visual helpers ────────────────────────────────────────────────────

function Pipeline({ stages }: { stages: { label: string; count: number; color: string }[] }) {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'stretch', overflowX: 'auto', paddingBottom: 4 }}>
      {stages.map((s, i) => (
        <React.Fragment key={s.label}>
          <div style={{
            flex: '1 1 0', minWidth: 70, textAlign: 'center', padding: '10px 6px',
            background: `var(--mantine-color-${s.color}-0)`,
            border: `1px solid var(--mantine-color-${s.color}-3)`,
            borderRadius: 8,
          }}>
            <Text size="xl" fw={700} c={s.count > 0 ? s.color : 'dimmed'}>{s.count}</Text>
            <Text size="xs" c="dimmed" lineClamp={2}>{s.label}</Text>
          </div>
          {i < stages.length - 1 && (
            <div style={{ display: 'flex', alignItems: 'center', color: 'var(--mantine-color-gray-4)', padding: '0 2px' }}>
              <IconChevronRight size={14} />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function StatusBar({ segments }: { segments: { label: string; count: number; color: string }[] }) {
  const total = Math.max(segments.reduce((s, seg) => s + seg.count, 0), 1);
  return (
    <Stack gap="xs">
      <Group gap={2} style={{ borderRadius: 4, overflow: 'hidden', height: 10 }}>
        {segments.filter(s => s.count > 0).map(seg => (
          <div key={seg.label} style={{ flex: seg.count / total, height: '100%', background: `var(--mantine-color-${seg.color}-5)`, minWidth: 4 }} />
        ))}
      </Group>
      <Group gap="sm" wrap="wrap">
        {segments.map(seg => (
          <Group key={seg.label} gap={4} wrap="nowrap">
            <div style={{ width: 10, height: 10, borderRadius: 2, background: `var(--mantine-color-${seg.color}-5)`, flexShrink: 0 }} />
            <Text size="xs" c="dimmed">{seg.label}:</Text>
            <Text size="xs" fw={600}>{seg.count}</Text>
          </Group>
        ))}
      </Group>
    </Stack>
  );
}

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
              { key: 'prodReady', collection: 'production_orders', filter: { status: { _in: ['ready', 'released'] } } },
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

  return (
    <Stack gap="lg">
      <div>
        <Title order={2}>Operations Overview</Title>
        <Text c="dimmed" size="sm">Cross-department view — surface blockers, quality issues, and overdue work before they impact production.</Text>
      </div>

      {loading ? <Group justify="center" py="xl"><Loader /></Group> : (
        <>
          {/* ── Priority Cards ─────────────────────────────────────────────── */}
          <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
            <Paper
              p="md" radius="md" withBorder style={{ cursor: 'pointer', borderColor: n('prodBlocked') > 0 ? 'var(--mantine-color-red-5)' : undefined }}
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
              p="md" radius="md" withBorder style={{ cursor: 'pointer', borderColor: qcIssues > 0 ? 'var(--mantine-color-orange-5)' : undefined }}
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
              p="md" radius="md" withBorder style={{ cursor: 'pointer', borderColor: n('ordersOverdue') > 0 ? 'var(--mantine-color-yellow-5)' : undefined }}
              onClick={() => router.push('/ppic/orders')}
            >
              <Group justify="space-between" wrap="nowrap">
                <Stack gap={2}>
                  <Text size="xs" c="dimmed" fw={600} tt="uppercase">Deliveries Overdue</Text>
                  <Title order={2} c={n('ordersOverdue') > 0 ? 'yellow' : undefined}>{n('ordersOverdue')}</Title>
                  <Text size="xs" c="dimmed">Orders past expected arrival</Text>
                </Stack>
                <ThemeIcon size="xl" radius="md" variant={n('ordersOverdue') > 0 ? 'filled' : 'light'} color="yellow">
                  <IconTruckDelivery size={22} />
                </ThemeIcon>
              </Group>
            </Paper>

            <Paper
              p="md" radius="md" withBorder style={{ cursor: 'pointer' }}
              onClick={() => router.push('/ppic/production')}
            >
              <Group justify="space-between" wrap="nowrap">
                <Stack gap={2}>
                  <Text size="xs" c="dimmed" fw={600} tt="uppercase">Currently Running</Text>
                  <Title order={2} c="violet">{n('prodActive')}</Title>
                  <Text size="xs" c="dimmed">Production orders active</Text>
                </Stack>
                <ThemeIcon size="xl" radius="md" variant="light" color="violet">
                  <IconBuildingFactory size={22} />
                </ThemeIcon>
              </Group>
            </Paper>
          </SimpleGrid>

          {/* ── Operations Pipeline ─────────────────────────────────────────── */}
          <Paper p="md" radius="md" withBorder>
            <Text fw={600} size="sm" mb="sm">End-to-End Operations Pipeline</Text>
            <Pipeline stages={[
              { label: 'On Order', count: n('ordersOrdered') + n('ordersPartial'), color: 'blue' },
              { label: 'In QC', count: n('batchesQcPending') + n('batchesUnderQc'), color: 'orange' },
              { label: 'Stored & Ready', count: n('batchesStored'), color: 'teal' },
              { label: 'In Production', count: n('prodActive'), color: 'violet' },
              { label: 'Completed', count: n('prodCompleted'), color: 'green' },
            ]} />
            <Text size="xs" c="dimmed" mt="xs">Larger numbers in early stages = upstream bottleneck. Ideal: even or growing toward right.</Text>
          </Paper>

          {/* ── Status Breakdowns ───────────────────────────────────────────── */}
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <Paper p="md" radius="md" withBorder>
              <Text fw={600} size="sm" mb="sm">Production Orders</Text>
              <StatusBar segments={[
                { label: 'Waiting for materials', count: n('prodBlocked'), color: 'red' },
                { label: 'Ready to start', count: n('prodReady'), color: 'lime' },
                { label: 'Running', count: n('prodActive'), color: 'violet' },
                { label: 'Completed', count: n('prodCompleted'), color: 'green' },
              ]} />
            </Paper>
            <Paper p="md" radius="md" withBorder>
              <Text fw={600} size="sm" mb="sm">Batch Quality Status</Text>
              <StatusBar segments={[
                { label: 'Waiting inspection', count: n('batchesQcPending'), color: 'orange' },
                { label: 'Being inspected', count: n('batchesUnderQc'), color: 'blue' },
                { label: 'On hold', count: n('batchesHold'), color: 'yellow' },
                { label: 'Rejected', count: n('batchesRejected'), color: 'red' },
                { label: 'Stored & ready', count: n('batchesStored'), color: 'green' },
              ]} />
            </Paper>
          </SimpleGrid>

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
