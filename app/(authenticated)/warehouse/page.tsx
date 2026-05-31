'use client';

import {
  SimpleGrid, Paper, Text, Title, Group, Stack, ThemeIcon, Loader, Anchor,
  Divider, Badge, Table, Button, Box,
} from '@mantine/core';
import {
  IconTruckDelivery, IconBarcode, IconMapPin,
  IconAlertTriangle, IconCheck, IconCircleCheck, IconPackage,
} from '@tabler/icons-react';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { notifications } from '@mantine/notifications';

interface PickTask {
  production_order_id: string;
  order_number: string;
  product_name: string;
  material_request_id: string;
  request_number: string;
  material_id: string;
  material_name: string;
  requested_qty: number;
  unit: string;
  available_batch_id: string | null;
  available_batch_number: string | null;
  available_qty: number | null;
  batch_location: string | null;
  issued_qty: number;
  mr_item_id: string;
}

interface PutawayBatch {
  id: string;
  batch_number: string;
  qty: number;
  unit: string;
  material_id: string;
}

interface MetricCardProps {
  label: string;
  value: number;
  description: string;
  color: string;
  icon: typeof IconTruckDelivery;
  active?: boolean;
  onClick: () => void;
}

function MetricCard({ label, value, description, color, icon: Icon, active, onClick }: MetricCardProps) {
  return (
    <Paper
      p="md"
      radius="md"
      withBorder
      style={{
        cursor: 'pointer',
        minHeight: 136,
        borderColor: active ? `var(--mantine-color-${color}-4)` : undefined,
      }}
      onClick={onClick}
    >
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <Stack gap={8}>
          <Text size="xs" c="dimmed" fw={700} tt="uppercase">
            {label}
          </Text>
          <Group gap="xs" align="flex-end">
            <Text
              fw={800}
              lh={1}
              c={active ? color : 'dimmed'}
              style={{ fontSize: 38, fontVariantNumeric: 'tabular-nums' }}
            >
              {value}
            </Text>
            <Badge size="xs" color={active ? color : 'gray'} variant="light" mb={4}>
              {active ? 'Action' : 'Clear'}
            </Badge>
          </Group>
          <Text size="sm" c="dimmed">
            {description}
          </Text>
        </Stack>
        <ThemeIcon size={56} radius="md" variant={active ? 'filled' : 'light'} color={color}>
          <Icon size={24} />
        </ThemeIcon>
      </Group>
    </Paper>
  );
}

function EmptyQueueState({
  title,
  description,
  icon: Icon = IconCircleCheck,
}: {
  title: string;
  description: string;
  icon?: typeof IconCircleCheck;
}) {
  return (
    <Paper p="lg" radius="md" withBorder bg="var(--mantine-color-green-light)">
      <Group gap="md" align="center" wrap="nowrap">
        <ThemeIcon size={48} radius="xl" color="green" variant="filled">
          <Icon size={24} />
        </ThemeIcon>
        <Stack gap={2}>
          <Text fw={700}>{title}</Text>
          <Text size="sm" c="dimmed">{description}</Text>
        </Stack>
      </Group>
    </Paper>
  );
}

export default function WarehouseDashboard() {
  const router = useRouter();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [pickTasks, setPickTasks] = useState<PickTask[]>([]);
  const [putawayBatches, setPutawayBatches] = useState<PutawayBatch[]>([]);
  const [loadingKpis, setLoadingKpis] = useState(true);
  const [loadingPick, setLoadingPick] = useState(true);
  const [loadingPutaway, setLoadingPutaway] = useState(true);
  const [issuing, setIssuing] = useState<string | null>(null);

  // ── KPI counts ──────────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      const c = await fetch('/api/batch-counts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          counts: [
            { key: 'incoming', collection: 'raw_material_orders', filter: { status: { _eq: 'ordered' } } },
            { key: 'receivedAll', collection: 'raw_material_receipts' },
            { key: 'qcPending', collection: 'batches', filter: { status: { _eq: 'qc_pending' } } },
            { key: 'approvedWaiting', collection: 'batches', filter: { status: { _eq: 'approved' } } },
            { key: 'stored', collection: 'batches', filter: { status: { _eq: 'stored_available' } } },
            { key: 'pickPending', collection: 'material_request_items', filter: { issued_qty: { _eq: 0 } } },
          ],
        }),
      }).then(async r => r.ok ? (await r.json())?.counts ?? {} : {}).catch(() => ({}));
      setCounts(c);
      setLoadingKpis(false);
    }
    load();
  }, []);

  // ── Putaway queue (approved batches needing a bin) ───────────────────────────
  useEffect(() => {
    fetch('/api/items/batches?filter[status][_eq]=approved&fields[]=id&fields[]=batch_number&fields[]=qty&fields[]=unit&fields[]=material_id&limit=8&sort[]=-id')
      .then(async r => r.ok ? (await r.json())?.data ?? [] : [])
      .then(setPutawayBatches)
      .catch(() => setPutawayBatches([]))
      .finally(() => setLoadingPutaway(false));
  }, []);

  // ── Materials Needed for Production pick queue ───────────────────────────────
  const loadPickQueue = useCallback(async () => {
    setLoadingPick(true);
    try {
      const ordersRes = await fetch(
        '/api/items/production_orders?filter[status][_in]=released,in_progress' +
        '&fields[]=id&fields[]=order_number&fields[]=product_id&fields[]=status&limit=50&sort[]=priority'
      );
      const orders: Array<{ id: string; order_number: string; product_id: string }> =
        (await ordersRes.json())?.data ?? [];

      if (orders.length === 0) { setPickTasks([]); setLoadingPick(false); return; }

      const productIds = [...new Set(orders.map(o => o.product_id))];
      const productsRes = await fetch(
        `/api/items/products?filter[id][_in]=${productIds.join(',')}&fields[]=id&fields[]=name&limit=100`
      );
      const productMap: Record<string, string> = {};
      for (const p of (await productsRes.json())?.data ?? []) productMap[p.id] = p.name;

      const orderIds = orders.map(o => o.id);
      const mrRes = await fetch(
        `/api/items/material_requests?filter[production_order_id][_in]=${orderIds.join(',')}` +
        `&filter[status][_in]=submitted,approved&fields[]=id&fields[]=request_number&fields[]=production_order_id&limit=100`
      );
      const mrs: Array<{ id: string; request_number: string; production_order_id: string }> =
        (await mrRes.json())?.data ?? [];

      if (mrs.length === 0) { setPickTasks([]); setLoadingPick(false); return; }

      const mrIds = mrs.map(m => m.id);
      const itemsRes = await fetch(
        `/api/items/material_request_items?filter[material_request_id][_in]=${mrIds.join(',')}` +
        `&filter[issued_qty][_eq]=0` +
        `&fields[]=id&fields[]=material_request_id&fields[]=material_id&fields[]=requested_qty&fields[]=unit&fields[]=issued_qty&limit=200`
      );
      const mrItems: Array<{ id: string; material_request_id: string; material_id: string; requested_qty: number; unit: string; issued_qty: number }> =
        (await itemsRes.json())?.data ?? [];

      if (mrItems.length === 0) { setPickTasks([]); setLoadingPick(false); return; }

      const materialIds = [...new Set(mrItems.map(i => i.material_id))];
      const matsRes = await fetch(
        `/api/items/raw_materials?filter[id][_in]=${materialIds.join(',')}&fields[]=id&fields[]=name&limit=200`
      );
      const matMap: Record<string, string> = {};
      for (const m of (await matsRes.json())?.data ?? []) matMap[m.id] = m.name;

      const batchesRes = await fetch(
        `/api/items/batches?filter[material_id][_in]=${materialIds.join(',')}` +
        `&filter[status][_eq]=stored_available` +
        `&fields[]=id&fields[]=batch_number&fields[]=material_id&fields[]=qty&fields[]=unit&fields[]=current_location_id` +
        `&sort[]=expiry_date&limit=500`
      );
      const batches: Array<{ id: string; batch_number: string; material_id: string; qty: number; unit: string; current_location_id: string | null }> =
        (await batchesRes.json())?.data ?? [];

      const locationIds = [...new Set(batches.map(b => b.current_location_id).filter(Boolean))] as string[];
      const locMap: Record<string, string> = {};
      if (locationIds.length > 0) {
        const locsRes = await fetch(
          `/api/items/warehouse_locations?filter[id][_in]=${locationIds.join(',')}&fields[]=id&fields[]=location_code&limit=200`
        );
        for (const l of (await locsRes.json())?.data ?? []) locMap[l.id] = l.location_code;
      }

      const mrMap = Object.fromEntries(mrs.map(m => [m.id, m]));
      const orderMap = Object.fromEntries(orders.map(o => [o.id, o]));
      const batchByMaterial: Record<string, typeof batches[0]> = {};
      for (const b of batches) {
        if (!batchByMaterial[b.material_id]) batchByMaterial[b.material_id] = b;
      }

      const tasks: PickTask[] = mrItems.map(item => {
        const mr = mrMap[item.material_request_id];
        const order = mr ? orderMap[mr.production_order_id] : null;
        const batch = batchByMaterial[item.material_id] ?? null;
        return {
          production_order_id: order?.id ?? '',
          order_number: order?.order_number ?? '—',
          product_name: order ? (productMap[order.product_id] ?? '—') : '—',
          material_request_id: mr?.id ?? '',
          request_number: mr?.request_number ?? '—',
          material_id: item.material_id,
          material_name: matMap[item.material_id] ?? item.material_id.slice(0, 8),
          requested_qty: item.requested_qty,
          unit: item.unit,
          available_batch_id: batch?.id ?? null,
          available_batch_number: batch?.batch_number ?? null,
          available_qty: batch?.qty ?? null,
          batch_location: batch?.current_location_id ? (locMap[batch.current_location_id] ?? '—') : null,
          issued_qty: item.issued_qty,
          mr_item_id: item.id,
        };
      }).filter(t => t.production_order_id);

      setPickTasks(tasks);
    } catch (err) {
      console.error('Failed to load pick queue:', err);
    } finally {
      setLoadingPick(false);
    }
  }, []);

  useEffect(() => { loadPickQueue(); }, [loadPickQueue]);

  const issueBatch = async (task: PickTask) => {
    if (!task.available_batch_id) {
      notifications.show({ title: 'No available batch', message: `No production-ready batch found for ${task.material_name}`, color: 'orange' });
      return;
    }
    setIssuing(task.mr_item_id);
    try {
      await fetch(`/api/items/batches/${task.available_batch_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'issued' }),
      });
      await fetch(`/api/items/material_request_items/${task.mr_item_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issued_qty: task.available_qty }),
      });
      notifications.show({
        title: 'Sent to production',
        message: `${task.material_name} (${task.available_batch_number}) was sent to production.`,
        color: 'green',
      });
      await loadPickQueue();
    } catch (err) {
      notifications.show({ title: 'Error', message: err instanceof Error ? err.message : 'Failed', color: 'red' });
    } finally {
      setIssuing(null);
    }
  };

  const n = (k: string) => counts[k] ?? 0;
  const pendingTasks = pickTasks.filter(t => t.available_batch_id);
  const blockedTasks = pickTasks.filter(t => !t.available_batch_id);
  const warehouseFlow = [
    { stage: 'Deliveries Due', count: n('incoming'), color: 'blue', description: 'Supplier orders expected' },
    { stage: 'Waiting QC', count: n('qcPending'), color: 'orange', description: 'Received batches to inspect' },
    { stage: 'Approved to Store', count: n('approvedWaiting'), color: 'teal', description: 'Cleared batches needing bins' },
    { stage: 'Stored & Ready', count: n('stored'), color: 'green', description: 'Available for production' },
  ];
  const maxFlowCount = Math.max(...warehouseFlow.map(item => item.count), 1);
  const totalOpenFlow = n('incoming') + n('qcPending') + n('approvedWaiting');

  return (
    <Stack gap="lg">
      <div>
        <Title order={2}>Warehouse Operations</Title>
        <Text c="dimmed" size="sm">Receive raw materials, approve QC batches, assign storage, and send materials to production.</Text>
      </div>

      {loadingKpis ? <Group justify="center" py="xl"><Loader /></Group> : (
        <>
          {/* ── Priority Cards ─────────────────────────────────────────────── */}
          <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
            <MetricCard
              label="Deliveries Expected"
              value={n('incoming')}
              description="Raw material orders on the way"
              color="blue"
              icon={IconTruckDelivery}
              active={n('incoming') > 0}
              onClick={() => router.push('/warehouse/incoming')}
            />

            <MetricCard
              label="Waiting for QC"
              value={n('qcPending')}
              description="Received batches waiting for inspection"
              color="orange"
              icon={IconBarcode}
              active={n('qcPending') > 0}
              onClick={() => router.push('/warehouse/batches')}
            />

            <MetricCard
              label="Approved - Needs Storage"
              value={n('approvedWaiting')}
              description="QC-approved batches needing a bin"
              color="teal"
              icon={IconMapPin}
              active={n('approvedWaiting') > 0}
              onClick={() => router.push('/warehouse/putaway')}
            />

            <MetricCard
              label="Stored & Ready"
              value={n('stored')}
              description="Batches available for production"
              color="green"
              icon={IconPackage}
              active={n('stored') > 0}
              onClick={() => router.push('/warehouse/batches')}
            />
          </SimpleGrid>

          {/* ── Warehouse Flow Pipeline ─────────────────────────────────────── */}
          <Paper p="md" radius="md" withBorder>
            <Group justify="space-between" align="flex-start" mb="md">
              <div>
                <Text fw={700} size="sm">Warehouse Flow</Text>
                <Text size="xs" c="dimmed">A quick view of where work is currently sitting.</Text>
              </div>
              <Badge color={totalOpenFlow > 0 ? 'teal' : 'green'} variant="light">
                {totalOpenFlow > 0 ? `${totalOpenFlow} open actions` : 'No bottlenecks'}
              </Badge>
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="sm">
              {warehouseFlow.map((item) => {
                const width = item.count === 0 ? 0 : Math.max(12, Math.round((item.count / maxFlowCount) * 100));
                return (
                  <Paper key={item.stage} p="sm" radius="sm" withBorder>
                    <Group justify="space-between" mb="xs" wrap="nowrap">
                      <Text size="xs" c="dimmed" fw={700} tt="uppercase">{item.stage}</Text>
                      <Text fw={800} c={item.count > 0 ? item.color : 'dimmed'} style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {item.count}
                      </Text>
                    </Group>
                    <Box h={10} bg="var(--mantine-color-dark-5)" style={{ borderRadius: 999, overflow: 'hidden' }}>
                      <Box
                        h="100%"
                        w={`${width}%`}
                        bg={item.count > 0 ? `var(--mantine-color-${item.color}-6)` : 'transparent'}
                        style={{ borderRadius: 999, transition: 'width 180ms ease' }}
                      />
                    </Box>
                    <Text size="xs" c="dimmed" mt="xs">{item.description}</Text>
                  </Paper>
                );
              })}
            </SimpleGrid>
          </Paper>
          {/* ── Putaway Queue ───────────────────────────────────────────────── */}
          <Divider label="Putaway Queue — Batches Needing a Bin" labelPosition="left" />
          {loadingPutaway ? (
            <Group justify="center" py="sm"><Loader size="sm" /></Group>
          ) : putawayBatches.length === 0 ? (
            <EmptyQueueState
              title="All approved batches have a storage plan."
              description="Nothing needs putaway right now. New QC-approved batches will appear here when they need a bin."
              icon={IconMapPin}
            />
          ) : (
            <Paper p="md" radius="md" withBorder>
              <Group justify="space-between" mb="sm">
                <Text fw={600} size="sm">Batches Cleared for Putaway ({putawayBatches.length})</Text>
                <Anchor href="/warehouse/putaway" size="xs">Go to putaway →</Anchor>
              </Group>
              <Table withTableBorder withColumnBorders>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Batch</Table.Th>
                    <Table.Th>Quantity</Table.Th>
                    <Table.Th>Action</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {putawayBatches.map(b => (
                    <Table.Tr key={b.id}>
                      <Table.Td><Text size="sm" style={{ fontFamily: 'monospace' }}>{b.batch_number}</Text></Table.Td>
                      <Table.Td><Text size="sm">{b.qty} {b.unit}</Text></Table.Td>
                      <Table.Td>
                        <Anchor href="/warehouse/slotting" size="xs">Assign location →</Anchor>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Paper>
          )}

          {/* ── Send to Production Queue ────────────────────────────────────── */}
          <Divider label="Materials Needed for Production" labelPosition="left" />
          <Text size="sm" c="dimmed">
            Materials needed for active production orders. Only batches marked as available for production can be sent to the floor.
          </Text>

          {loadingPick ? (
            <Group justify="center" py="md"><Loader size="sm" /></Group>
          ) : pickTasks.length === 0 ? (
            <EmptyQueueState
              title="No materials need to be sent right now."
              description="Production has no open material requests waiting on the warehouse. New requests will appear here when production orders are released."
              icon={IconCheck}
            />
          ) : (
            <Stack gap="md">
              {pendingTasks.length > 0 && (
                <Paper p="md" radius="md" withBorder>
                  <Text size="sm" fw={600} mb="sm" c="green">Ready to Send ({pendingTasks.length})</Text>
                  <Table withTableBorder withColumnBorders>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Order</Table.Th>
                        <Table.Th>Material</Table.Th>
                        <Table.Th>Required</Table.Th>
                        <Table.Th>Batch</Table.Th>
                        <Table.Th>Bin</Table.Th>
                        <Table.Th>Available</Table.Th>
                        <Table.Th>Action</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {pendingTasks.map(task => (
                        <Table.Tr key={task.mr_item_id}>
                          <Table.Td>
                            <Text
                              size="sm" fw={500} style={{ cursor: 'pointer', textDecoration: 'underline' }}
                              onClick={() => router.push(`/warehouse/production/${task.production_order_id}`)}
                            >
                              {task.order_number}
                            </Text>
                          </Table.Td>
                          <Table.Td><Text size="sm">{task.material_name}</Text></Table.Td>
                          <Table.Td><Text size="sm">{task.requested_qty} {task.unit}</Text></Table.Td>
                          <Table.Td><Text size="xs" style={{ fontFamily: 'monospace' }}>{task.available_batch_number}</Text></Table.Td>
                          <Table.Td><Badge size="xs" variant="light" color="blue">{task.batch_location ?? '—'}</Badge></Table.Td>
                          <Table.Td><Text size="sm">{task.available_qty} {task.unit}</Text></Table.Td>
                          <Table.Td>
                            <Button size="compact-xs" color="green" loading={issuing === task.mr_item_id} onClick={() => issueBatch(task)}>Send</Button>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Paper>
              )}

              {blockedTasks.length > 0 && (
                <Paper p="md" radius="md" withBorder>
                  <Group gap="xs" mb="sm">
                    <IconAlertTriangle size={16} color="var(--mantine-color-orange-6)" />
                    <Text size="sm" fw={600} c="orange">No Production-Ready Stock ({blockedTasks.length})</Text>
                  </Group>
                  <Table withTableBorder withColumnBorders>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Order</Table.Th>
                        <Table.Th>Material</Table.Th>
                        <Table.Th>Required</Table.Th>
                        <Table.Th>Status</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {blockedTasks.map(task => (
                        <Table.Tr key={task.mr_item_id}>
                          <Table.Td>
                            <Text
                              size="sm" fw={500} style={{ cursor: 'pointer', textDecoration: 'underline' }}
                              onClick={() => router.push(`/warehouse/production/${task.production_order_id}`)}
                            >
                              {task.order_number}
                            </Text>
                          </Table.Td>
                          <Table.Td><Text size="sm">{task.material_name}</Text></Table.Td>
                          <Table.Td><Text size="sm">{task.requested_qty} {task.unit}</Text></Table.Td>
                          <Table.Td><Badge size="xs" color="orange" variant="light">No batch available</Badge></Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Paper>
              )}
            </Stack>
          )}
        </>
      )}
    </Stack>
  );
}
