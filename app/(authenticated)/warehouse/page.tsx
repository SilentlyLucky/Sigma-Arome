'use client';

import {
  SimpleGrid, Paper, Text, Title, Group, Stack, ThemeIcon, Loader, Anchor,
  Divider, Badge, Alert, Table, Button,
} from '@mantine/core';
import {
  IconTruckDelivery, IconBarcode, IconMapPin, IconBuildingFactory,
  IconAlertTriangle, IconCheck,
} from '@tabler/icons-react';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { notifications } from '@mantine/notifications';

interface KPI { label: string; value: number | null; icon: typeof IconTruckDelivery; color: string; href?: string }

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

export default function WarehouseDashboard() {
  const router = useRouter();
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [pickTasks, setPickTasks] = useState<PickTask[]>([]);
  const [loadingKpis, setLoadingKpis] = useState(true);
  const [loadingPick, setLoadingPick] = useState(true);
  const [issuing, setIssuing] = useState<string | null>(null);

  // ── KPI counts ──────────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      const count = async (collection: string, filter?: Record<string, unknown>) => {
        try {
          const params = new URLSearchParams({ 'aggregate[count]': '*' });
          if (filter) params.set('filter', JSON.stringify(filter));
          const r = await fetch(`/api/items/${collection}?${params}`);
          if (!r.ok) return 0;
          const d = await r.json();
          return Number(d?.data?.[0]?.count ?? 0);
        } catch { return 0; }
      };

      const [incoming, receivedToday, qcPending, approvedWaiting, pickPending] = await Promise.all([
        count('raw_material_orders', { status: { _eq: 'ordered' } }),
        count('raw_material_receipts'),
        count('batches', { status: { _eq: 'qc_pending' } }),
        count('batches', { status: { _eq: 'approved' } }),
        count('material_request_items', { issued_qty: { _eq: 0 } }),
      ]);

      setKpis([
        { label: 'Expected Raw Material Deliveries', value: incoming, icon: IconTruckDelivery, color: 'blue', href: '/warehouse/incoming' },
        { label: 'Received Materials', value: receivedToday, icon: IconTruckDelivery, color: 'green', href: '/warehouse/receive' },
        { label: 'Batches Waiting for QC', value: qcPending, icon: IconBarcode, color: 'orange', href: '/warehouse/batches' },
        { label: 'Approved Batches to Store', value: approvedWaiting, icon: IconMapPin, color: 'teal', href: '/warehouse/putaway' },
        { label: 'Materials to Send to Production', value: pickPending, icon: IconBuildingFactory, color: 'grape' },
      ]);
      setLoadingKpis(false);
    }
    load();
  }, []);

  // ── Materials Needed for Production ──────────────────────────────────────────
  // Builds a pick list from:
  //   active production orders (released / in_progress / ready)
  //   → their auto-generated material requests (submitted / approved)
  //   → material_request_items where issued_qty = 0
  //   → joined with stored_available batches for each material
  const loadPickQueue = useCallback(async () => {
    setLoadingPick(true);
    try {
      // 1. Active production orders
      const ordersRes = await fetch(
        '/api/items/production_orders' +
        '?filter[status][_in]=ready,released,in_progress' +
        '&fields[]=id&fields[]=order_number&fields[]=product_id&fields[]=status' +
        '&limit=50&sort[]=priority'
      );
      const orders: Array<{ id: string; order_number: string; product_id: string }> =
        (await ordersRes.json())?.data ?? [];

      if (orders.length === 0) { setPickTasks([]); setLoadingPick(false); return; }

      // 2. Product names
      const productIds = [...new Set(orders.map(o => o.product_id))];
      const productsRes = await fetch(
        `/api/items/products?filter[id][_in]=${productIds.join(',')}&fields[]=id&fields[]=name&limit=100`
      );
      const productMap: Record<string, string> = {};
      for (const p of (await productsRes.json())?.data ?? []) productMap[p.id] = p.name;

      // 3. Material requests for these production orders
      const orderIds = orders.map(o => o.id);
      const mrRes = await fetch(
        `/api/items/material_requests` +
        `?filter[production_order_id][_in]=${orderIds.join(',')}` +
        `&filter[status][_in]=submitted,approved` +
        `&fields[]=id&fields[]=request_number&fields[]=production_order_id&limit=100`
      );
      const mrs: Array<{ id: string; request_number: string; production_order_id: string }> =
        (await mrRes.json())?.data ?? [];

      if (mrs.length === 0) { setPickTasks([]); setLoadingPick(false); return; }

      // 4. Material request items not yet issued
      const mrIds = mrs.map(m => m.id);
      const itemsRes = await fetch(
        `/api/items/material_request_items` +
        `?filter[material_request_id][_in]=${mrIds.join(',')}` +
        `&filter[issued_qty][_eq]=0` +
        `&fields[]=id&fields[]=material_request_id&fields[]=material_id&fields[]=requested_qty&fields[]=unit&fields[]=issued_qty` +
        `&limit=200`
      );
      const mrItems: Array<{
        id: string; material_request_id: string; material_id: string;
        requested_qty: number; unit: string; issued_qty: number;
      }> = (await itemsRes.json())?.data ?? [];

      if (mrItems.length === 0) { setPickTasks([]); setLoadingPick(false); return; }

      // 5. Material names
      const materialIds = [...new Set(mrItems.map(i => i.material_id))];
      const matsRes = await fetch(
        `/api/items/raw_materials?filter[id][_in]=${materialIds.join(',')}&fields[]=id&fields[]=name&limit=200`
      );
      const matMap: Record<string, string> = {};
      for (const m of (await matsRes.json())?.data ?? []) matMap[m.id] = m.name;

      // 6. Available batches (stored_available) for each material
      const batchesRes = await fetch(
        `/api/items/batches` +
        `?filter[material_id][_in]=${materialIds.join(',')}` +
        `&filter[status][_eq]=stored_available` +
        `&fields[]=id&fields[]=batch_number&fields[]=material_id&fields[]=qty&fields[]=unit&fields[]=current_location_id` +
        `&sort[]=expiry_date&limit=500`
      );
      const batches: Array<{
        id: string; batch_number: string; material_id: string;
        qty: number; unit: string; current_location_id: string | null;
      }> = (await batchesRes.json())?.data ?? [];

      // 7. Location codes
      const locationIds = [...new Set(batches.map(b => b.current_location_id).filter(Boolean))] as string[];
      const locMap: Record<string, string> = {};
      if (locationIds.length > 0) {
        const locsRes = await fetch(
          `/api/items/warehouse_locations?filter[id][_in]=${locationIds.join(',')}&fields[]=id&fields[]=location_code&limit=200`
        );
        for (const l of (await locsRes.json())?.data ?? []) locMap[l.id] = l.location_code;
      }

      // Build pick tasks — join everything
      const mrMap = Object.fromEntries(mrs.map(m => [m.id, m]));
      const orderMap = Object.fromEntries(orders.map(o => [o.id, o]));
      // First available batch per material (FEFO — sorted by expiry_date)
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
      }).filter(t => t.production_order_id); // drop orphaned items

      setPickTasks(tasks);
    } catch (err) {
      console.error('Failed to load pick queue:', err);
    } finally {
      setLoadingPick(false);
    }
  }, []);

  useEffect(() => { loadPickQueue(); }, [loadPickQueue]);

  // Issue a batch to production
  const issueBatch = async (task: PickTask) => {
    if (!task.available_batch_id) {
      notifications.show({ title: 'No available batch', message: `No production-ready batch found for ${task.material_name}`, color: 'orange' });
      return;
    }
    setIssuing(task.mr_item_id);
    try {
      // Mark batch as issued
      await fetch(`/api/items/batches/${task.available_batch_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'issued' }),
      });
      // Update issued_qty on the MR item
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

  const pendingTasks = pickTasks.filter(t => t.available_batch_id);
  const blockedTasks = pickTasks.filter(t => !t.available_batch_id);

  return (
    <Stack gap="lg">
      <div>
        <Title order={2}>Warehouse Operation Dashboard</Title>
        <Text c="dimmed" size="sm">Receive raw materials, store approved batches, and send available materials to production.</Text>
      </div>

      {/* KPI tiles */}
      {loadingKpis ? (
        <Group justify="center" py="xl"><Loader /></Group>
      ) : (
        <SimpleGrid cols={{ base: 2, sm: 3, md: 5 }} spacing="md">
          {kpis.map((k) => (
            <Paper key={k.label} p="md" radius="md" withBorder>
              <Group justify="space-between" wrap="nowrap">
                <Stack gap={4}>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700} lineClamp={2}>{k.label}</Text>
                  <Title order={3}>{k.value ?? '—'}</Title>
                </Stack>
                <ThemeIcon size="xl" radius="md" variant="light" color={k.color}><k.icon size={24} /></ThemeIcon>
              </Group>
              {k.href && <Anchor href={k.href} size="xs" c="dimmed" mt={4} display="block">View →</Anchor>}
            </Paper>
          ))}
        </SimpleGrid>
      )}

      {/* Materials Needed for Production */}
      <Divider label="Materials Needed for Production" labelPosition="left" />
      <Text size="sm" c="dimmed">
        These materials are needed for active production orders. Only batches marked Available for production
        can be sent to the production floor. New requirements appear here when PPIC creates a production order.
      </Text>

      {loadingPick ? (
        <Group justify="center" py="md"><Loader size="sm" /></Group>
      ) : pickTasks.length === 0 ? (
        <Alert color="green" variant="light" icon={<IconCheck size={16} />}>
          No materials need to be sent right now. Active production orders are already covered or have no open material requests.
        </Alert>
      ) : (
        <Stack gap="md">
          {/* Ready to send */}
          {pendingTasks.length > 0 && (
            <Paper p="md" radius="md" withBorder>
              <Text size="sm" fw={600} mb="sm" c="green">
                Ready to Send ({pendingTasks.length})
              </Text>
              <Table withTableBorder withColumnBorders>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Production Order</Table.Th>
                    <Table.Th>Product</Table.Th>
                    <Table.Th>Material</Table.Th>
                    <Table.Th>Required</Table.Th>
                    <Table.Th>Batch</Table.Th>
                    <Table.Th>Location</Table.Th>
                    <Table.Th>Available</Table.Th>
                    <Table.Th>Action</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {pendingTasks.map(task => (
                    <Table.Tr key={task.mr_item_id}>
                      <Table.Td>
                        <Text size="sm" fw={500}>{task.order_number}</Text>
                      </Table.Td>
                      <Table.Td><Text size="sm">{task.product_name}</Text></Table.Td>
                      <Table.Td><Text size="sm">{task.material_name}</Text></Table.Td>
                      <Table.Td>
                        <Text size="sm">{task.requested_qty} {task.unit}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="xs" style={{ fontFamily: 'monospace' }}>{task.available_batch_number}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge size="xs" variant="light" color="blue">{task.batch_location ?? '—'}</Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{task.available_qty} {task.unit}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Button
                          size="compact-xs"
                          color="green"
                          loading={issuing === task.mr_item_id}
                          onClick={() => issueBatch(task)}
                        >
                          Send
                        </Button>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Paper>
          )}

          {/* Blocked - no production-ready stock */}
          {blockedTasks.length > 0 && (
            <Paper p="md" radius="md" withBorder>
              <Group gap="xs" mb="sm">
                <IconAlertTriangle size={16} color="var(--mantine-color-orange-6)" />
                <Text size="sm" fw={600} c="orange">
                  Blocked - No Production-Ready Stock ({blockedTasks.length})
                </Text>
              </Group>
              <Table withTableBorder withColumnBorders>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Production Order</Table.Th>
                    <Table.Th>Product</Table.Th>
                    <Table.Th>Material</Table.Th>
                    <Table.Th>Required</Table.Th>
                    <Table.Th>Status</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {blockedTasks.map(task => (
                    <Table.Tr key={task.mr_item_id}>
                      <Table.Td><Text size="sm" fw={500}>{task.order_number}</Text></Table.Td>
                      <Table.Td><Text size="sm">{task.product_name}</Text></Table.Td>
                      <Table.Td><Text size="sm">{task.material_name}</Text></Table.Td>
                      <Table.Td><Text size="sm">{task.requested_qty} {task.unit}</Text></Table.Td>
                      <Table.Td>
                        <Badge size="xs" color="orange" variant="light">No batch available for production</Badge>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Paper>
          )}
        </Stack>
      )}
    </Stack>
  );
}
