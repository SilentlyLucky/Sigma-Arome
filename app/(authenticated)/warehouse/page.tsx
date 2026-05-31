'use client';

import {
  SimpleGrid, Paper, Text, Title, Group, Stack, ThemeIcon, Loader, Anchor,
  Divider, Badge, Alert, Table, Button,
} from '@mantine/core';
import { BarChart } from '@mantine/charts';
import {
  IconTruckDelivery, IconBarcode, IconMapPin, IconBuildingFactory,
  IconAlertTriangle, IconCheck, IconCircleCheck, IconChevronRight, IconPackage,
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
        '/api/items/production_orders?filter[status][_in]=ready,released,in_progress' +
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
            <Paper p="md" radius="md" withBorder style={{ cursor: 'pointer', borderColor: n('incoming') > 0 ? 'var(--mantine-color-blue-4)' : undefined }} onClick={() => router.push('/warehouse/incoming')}>
              <Group justify="space-between" wrap="nowrap">
                <Stack gap={2}>
                  <Text size="xs" c="dimmed" fw={600} tt="uppercase">Deliveries Expected</Text>
                  <Title order={2} c="blue">{n('incoming')}</Title>
                  <Text size="xs" c="dimmed">Orders on the way</Text>
                </Stack>
                <ThemeIcon size="xl" radius="md" variant="light" color="blue"><IconTruckDelivery size={22} /></ThemeIcon>
              </Group>
            </Paper>

            <Paper p="md" radius="md" withBorder style={{ cursor: 'pointer', borderColor: n('qcPending') > 0 ? 'var(--mantine-color-orange-4)' : undefined }} onClick={() => router.push('/warehouse/batches')}>
              <Group justify="space-between" wrap="nowrap">
                <Stack gap={2}>
                  <Text size="xs" c="dimmed" fw={600} tt="uppercase">Waiting for QC</Text>
                  <Title order={2} c={n('qcPending') > 0 ? 'orange' : undefined}>{n('qcPending')}</Title>
                  <Text size="xs" c="dimmed">Received batches in queue</Text>
                </Stack>
                <ThemeIcon size="xl" radius="md" variant={n('qcPending') > 0 ? 'filled' : 'light'} color="orange"><IconBarcode size={22} /></ThemeIcon>
              </Group>
            </Paper>

            <Paper p="md" radius="md" withBorder style={{ cursor: 'pointer', borderColor: n('approvedWaiting') > 0 ? 'var(--mantine-color-teal-4)' : undefined }} onClick={() => router.push('/warehouse/putaway')}>
              <Group justify="space-between" wrap="nowrap">
                <Stack gap={2}>
                  <Text size="xs" c="dimmed" fw={600} tt="uppercase">Approved — Needs Storage</Text>
                  <Title order={2} c={n('approvedWaiting') > 0 ? 'teal' : undefined}>{n('approvedWaiting')}</Title>
                  <Text size="xs" c="dimmed">Cleared for putaway</Text>
                </Stack>
                <ThemeIcon size="xl" radius="md" variant={n('approvedWaiting') > 0 ? 'filled' : 'light'} color="teal"><IconMapPin size={22} /></ThemeIcon>
              </Group>
            </Paper>

            <Paper p="md" radius="md" withBorder style={{ cursor: 'pointer' }} onClick={() => router.push('/warehouse/batches')}>
              <Group justify="space-between" wrap="nowrap">
                <Stack gap={2}>
                  <Text size="xs" c="dimmed" fw={600} tt="uppercase">Stored & Ready</Text>
                  <Title order={2} c="green">{n('stored')}</Title>
                  <Text size="xs" c="dimmed">Available for production</Text>
                </Stack>
                <ThemeIcon size="xl" radius="md" variant="light" color="green"><IconPackage size={22} /></ThemeIcon>
              </Group>
            </Paper>
          </SimpleGrid>

          {/* ── Warehouse Flow Pipeline ─────────────────────────────────────── */}
          <Paper p="md" radius="md" withBorder>
            <Text fw={600} size="sm" mb="sm">Warehouse Flow</Text>
            <BarChart
              h={180}
              data={[
                { stage: 'Deliveries Due', count: n('incoming') },
                { stage: 'Waiting QC', count: n('qcPending') },
                { stage: 'Approved→Store', count: n('approvedWaiting') },
                { stage: 'Stored & Ready', count: n('stored') },
              ]}
              dataKey="stage"
              series={[{ name: 'count', label: 'Count', color: 'teal.6' }]}
              withLegend={false}
            />
          </Paper>

          {/* ── Putaway Queue ───────────────────────────────────────────────── */}
          <Divider label="Putaway Queue — Batches Needing a Bin" labelPosition="left" />
          {loadingPutaway ? (
            <Group justify="center" py="sm"><Loader size="sm" /></Group>
          ) : putawayBatches.length === 0 ? (
            <Alert color="green" variant="light" icon={<IconCircleCheck size={16} />}>
              No batches are waiting for putaway right now.
            </Alert>
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
            <Alert color="green" variant="light" icon={<IconCheck size={16} />}>
              No materials need to be sent right now.
            </Alert>
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
                          <Table.Td><Text size="sm" fw={500}>{task.order_number}</Text></Table.Td>
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
                          <Table.Td><Text size="sm" fw={500}>{task.order_number}</Text></Table.Td>
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
