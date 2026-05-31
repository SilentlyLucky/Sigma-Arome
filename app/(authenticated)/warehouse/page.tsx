'use client';

import { SimpleGrid, Paper, Text, Title, Group, Stack, Loader, Anchor, Badge, Table, Button, Box } from '@mantine/core';
import { IconTruckDelivery, IconBarcode, IconMapPin, IconAlertTriangle, IconCircleCheck, IconPackage } from '@tabler/icons-react';
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
            { key: 'incoming',        collection: 'raw_material_orders', filter: { status: { _eq: 'ordered' } } },
            { key: 'qcPending',       collection: 'batches',             filter: { status: { _eq: 'qc_pending' } } },
            { key: 'approvedWaiting', collection: 'batches',             filter: { status: { _eq: 'approved' } } },
            { key: 'stored',          collection: 'batches',             filter: { status: { _eq: 'stored_available' } } },
          ],
        }),
      }).then(async r => r.ok ? (await r.json())?.counts ?? {} : {}).catch(() => ({}));
      setCounts(c);
      setLoadingKpis(false);
    }
    load();
  }, []);

  // ── Putaway queue ────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/items/batches?filter[status][_eq]=approved&fields[]=id&fields[]=batch_number&fields[]=qty&fields[]=unit&fields[]=material_id&limit=8&sort[]=-id')
      .then(async r => r.ok ? (await r.json())?.data ?? [] : [])
      .then(setPutawayBatches)
      .catch(() => setPutawayBatches([]))
      .finally(() => setLoadingPutaway(false));
  }, []);

  // ── Production pick queue ────────────────────────────────────────────────────
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
      notifications.show({ title: 'Sent to production', message: `${task.material_name} (${task.available_batch_number}) was sent to production.`, color: 'green' });
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
  const totalOpenFlow = n('incoming') + n('qcPending') + n('approvedWaiting');

  const kpiCards = [
    { label: 'Deliveries Expected',     value: n('incoming'),        icon: IconTruckDelivery, href: '/warehouse/incoming', link: 'View deliveries →' },
    { label: 'Waiting for QC',          value: n('qcPending'),       icon: IconBarcode,       href: '/warehouse/batches',  link: 'View batches →'    },
    { label: 'Approved — Needs Storage',value: n('approvedWaiting'), icon: IconMapPin,        href: '/warehouse/putaway',  link: 'Go to putaway →'   },
    { label: 'Stored & Ready',          value: n('stored'),          icon: IconPackage,       href: '/warehouse/batches',  link: 'View inventory →'  },
  ];

  const pipeline = [
    { stage: 'Deliveries Due',    count: n('incoming'),        description: 'Supplier orders expected' },
    { stage: 'Waiting QC',        count: n('qcPending'),       description: 'Received — to inspect'    },
    { stage: 'Approved to Store', count: n('approvedWaiting'), description: 'Cleared — needs a bin'    },
    { stage: 'Stored & Ready',    count: n('stored'),          description: 'Available for production'  },
  ];

  return (
    <Stack gap={32}>

      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <Group gap={16} align="center">
        <Box style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <IconTruckDelivery size={24} color="#2E7D32" strokeWidth={1.75} />
        </Box>
        <div>
          <Title order={2} fw={700} style={{ color: '#1F2937', lineHeight: 1.2 }}>Warehouse Operations</Title>
          <Text size="sm" style={{ color: '#6B7280', marginTop: 2 }}>
            Receive materials, manage QC flow, assign storage, send to production.
          </Text>
        </div>
      </Group>

      {loadingKpis ? (
        <Group justify="center" py="xl"><Loader color="primary" /></Group>
      ) : (
        <>
          {/* ── KPI Cards ──────────────────────────────────────────────────────── */}
          <SimpleGrid cols={{ base: 2, md: 4 }} spacing="md">
            {kpiCards.map(({ label, value, icon: Icon, href, link }) => {
              const active = value > 0;
              return (
                <Paper
                  key={label}
                  p="lg"
                  withBorder
                  onClick={() => router.push(href)}
                  style={{ cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', borderColor: active ? '#C8E6C9' : '#E8ECE8' }}
                >
                  <Stack gap={8}>
                    <Group justify="space-between" align="flex-start">
                      <Text size="xs" fw={600} tt="uppercase" style={{ color: '#9CA3AF', letterSpacing: '0.05em' }}>
                        {label}
                      </Text>
                      <Box style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: active ? '#E8F5E9' : '#F3F5F3', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={18} color={active ? '#2E7D32' : '#9CA3AF'} strokeWidth={1.75} />
                      </Box>
                    </Group>
                    <Text fw={700} style={{ fontSize: 34, color: active ? '#1F2937' : '#9CA3AF', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                      {value}
                    </Text>
                    <Text size="xs" fw={500} style={{ color: active ? '#2E7D32' : '#9CA3AF' }}>{link}</Text>
                  </Stack>
                </Paper>
              );
            })}
          </SimpleGrid>

          {/* ── Warehouse Pipeline ─────────────────────────────────────────────── */}
          <Paper p="xl" withBorder style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <Group justify="space-between" align="flex-start" mb={28}>
              <div>
                <Text fw={600} size="sm" style={{ color: '#1F2937' }}>Warehouse Flow</Text>
                <Text size="xs" style={{ color: '#6B7280', marginTop: 2 }}>Where work is currently sitting.</Text>
              </div>
              <Badge color={totalOpenFlow > 0 ? 'primary' : 'gray'} variant="light" size="sm">
                {totalOpenFlow > 0 ? `${totalOpenFlow} open actions` : 'All clear'}
              </Badge>
            </Group>
            <Group justify="space-between" align="flex-start" wrap="nowrap" gap={0}>
              {pipeline.map((item, idx) => (
                <Group key={item.stage} wrap="nowrap" gap={0} style={{ flex: 1 }} align="flex-start">
                  <Stack gap={4} align="center" style={{ flex: 1 }}>
                    <Text fw={800} style={{ fontSize: 32, color: item.count > 0 ? '#2E7D32' : '#D1D9D1', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                      {item.count}
                    </Text>
                    <Text size="xs" fw={600} tt="uppercase" style={{ color: '#9CA3AF', letterSpacing: '0.06em', textAlign: 'center' }}>
                      {item.stage}
                    </Text>
                    <Text size="xs" style={{ color: '#6B7280', textAlign: 'center', lineHeight: 1.3 }}>
                      {item.description}
                    </Text>
                  </Stack>
                  {idx < pipeline.length - 1 && (
                    <Text size="xl" style={{ color: '#D1D9D1', paddingTop: 4, paddingLeft: 4, paddingRight: 4, flexShrink: 0 }}>→</Text>
                  )}
                </Group>
              ))}
            </Group>
          </Paper>

          {/* ── Putaway Task Cards ─────────────────────────────────────────────── */}
          <Box>
            <Group justify="space-between" align="center" mb={12}>
              <Text fw={600} size="sm" style={{ color: '#1F2937' }}>
                Needs Storage Assignment{putawayBatches.length > 0 ? ` · ${putawayBatches.length}` : ''}
              </Text>
              <Anchor href="/warehouse/putaway" size="xs" fw={500} style={{ color: '#2E7D32' }}>Go to putaway →</Anchor>
            </Group>

            {loadingPutaway ? (
              <Group justify="center" py="md"><Loader size="sm" color="primary" /></Group>
            ) : putawayBatches.length === 0 ? (
              <Paper p="lg" withBorder style={{ borderColor: '#C8E6C9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <Group gap={16} align="center">
                  <Box style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <IconCircleCheck size={20} color="#2E7D32" />
                  </Box>
                  <div>
                    <Text fw={600} size="sm" style={{ color: '#1F2937' }}>All batches stored</Text>
                    <Text size="xs" style={{ color: '#6B7280' }}>No approved batches waiting for a storage bin.</Text>
                  </div>
                </Group>
              </Paper>
            ) : (
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                {putawayBatches.map(b => (
                  <Paper key={b.id} p="md" withBorder style={{ borderColor: '#E8ECE8', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                    <Group justify="space-between" align="flex-start" mb={12}>
                      <div>
                        <Text fw={600} size="sm" style={{ color: '#1F2937', fontFamily: 'monospace' }}>{b.batch_number}</Text>
                        <Text size="xs" style={{ color: '#9CA3AF', marginTop: 2 }}>Batch cleared for storage</Text>
                      </div>
                      <Text fw={500} size="sm" style={{ color: '#6B7280', flexShrink: 0 }}>{b.qty} {b.unit}</Text>
                    </Group>
                    <Button size="sm" color="primary" variant="filled" fullWidth onClick={() => router.push('/warehouse/slotting')} style={{ borderRadius: 10 }}>
                      Assign Location
                    </Button>
                  </Paper>
                ))}
              </SimpleGrid>
            )}
          </Box>

          {/* ── Production Materials ───────────────────────────────────────────── */}
          <Box>
            <Text fw={600} size="sm" mb={16} style={{ color: '#1F2937' }}>Materials Needed for Production</Text>

            {loadingPick ? (
              <Group justify="center" py="md"><Loader size="sm" color="primary" /></Group>
            ) : pickTasks.length === 0 ? (
              <Paper p="lg" withBorder style={{ borderColor: '#C8E6C9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <Group gap={16} align="center">
                  <Box style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <IconCircleCheck size={20} color="#2E7D32" />
                  </Box>
                  <div>
                    <Text fw={600} size="sm" style={{ color: '#1F2937' }}>No materials needed right now</Text>
                    <Text size="xs" style={{ color: '#6B7280' }}>Production has no open material requests waiting on the warehouse.</Text>
                  </div>
                </Group>
              </Paper>
            ) : (
              <Stack gap={16}>
                {pendingTasks.length > 0 && (
                  <Box>
                    <Text size="xs" fw={600} mb={10} style={{ color: '#2E7D32' }}>Ready to Send · {pendingTasks.length}</Text>
                    <Paper withBorder style={{ borderColor: '#E8ECE8', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                      <Table highlightOnHover highlightOnHoverColor="#F9FAF9">
                        <Table.Thead style={{ backgroundColor: '#F9FAF9' }}>
                          <Table.Tr>
                            {['Order', 'Material', 'Batch', 'Location', 'Qty', ''].map(h => (
                              <Table.Th key={h} style={{ color: '#6B7280', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</Table.Th>
                            ))}
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {pendingTasks.map(task => (
                            <Table.Tr key={task.mr_item_id} style={{ height: 52 }}>
                              <Table.Td>
                                <Text size="sm" fw={500} style={{ color: '#2E7D32', cursor: 'pointer' }}
                                  onClick={() => router.push(`/warehouse/production/${task.production_order_id}`)}>
                                  {task.order_number}
                                </Text>
                              </Table.Td>
                              <Table.Td><Text size="sm" style={{ color: '#1F2937' }}>{task.material_name}</Text></Table.Td>
                              <Table.Td><Text size="xs" style={{ color: '#6B7280', fontFamily: 'monospace' }}>{task.available_batch_number}</Text></Table.Td>
                              <Table.Td><Badge size="xs" color="primary" variant="light">{task.batch_location ?? '—'}</Badge></Table.Td>
                              <Table.Td><Text size="sm" style={{ color: '#4B5563' }}>{task.available_qty} {task.unit}</Text></Table.Td>
                              <Table.Td>
                                <Button size="compact-sm" color="primary" loading={issuing === task.mr_item_id} onClick={() => issueBatch(task)}>
                                  Send to Production
                                </Button>
                              </Table.Td>
                            </Table.Tr>
                          ))}
                        </Table.Tbody>
                      </Table>
                    </Paper>
                  </Box>
                )}

                {blockedTasks.length > 0 && (
                  <Paper p="md" withBorder style={{ borderLeft: '3px solid #D97706', borderColor: '#FDE68A', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                    <Group gap={8} mb={12} align="center">
                      <IconAlertTriangle size={16} color="#D97706" />
                      <Text size="sm" fw={600} style={{ color: '#92400E' }}>
                        No Stock Available · {blockedTasks.length} material{blockedTasks.length > 1 ? 's' : ''} blocked
                      </Text>
                    </Group>
                    <Stack gap={8}>
                      {blockedTasks.map(task => (
                        <Group key={task.mr_item_id} justify="space-between" wrap="nowrap">
                          <Text size="sm" style={{ color: '#4B5563' }}>{task.material_name}</Text>
                          <Group gap={16} wrap="nowrap">
                            <Text size="xs" style={{ color: '#9CA3AF' }}>{task.requested_qty} {task.unit}</Text>
                            <Text size="xs" style={{ color: '#9CA3AF' }}>Order: {task.order_number}</Text>
                          </Group>
                        </Group>
                      ))}
                    </Stack>
                  </Paper>
                )}
              </Stack>
            )}
          </Box>
        </>
      )}
    </Stack>
  );
}
