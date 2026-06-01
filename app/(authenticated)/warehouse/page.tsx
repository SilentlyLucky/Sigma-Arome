'use client';

import { Anchor, Badge, Box, Button, Group, Paper, SimpleGrid, Stack, Table, Text, Title } from '@mantine/core';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Hourglass,
  MapPin,
  PackageCheck,
  Send,
  Truck,
} from 'lucide-react';
import { DashboardListLoading, DashboardLoading } from '@/components/ui/dashboard-loading';
import { OperationalInsightPanel } from '@/components/ui/operational-dashboard';
import type { CSSProperties } from 'react';
import { useCallback, useEffect, useState } from 'react';
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

const surfaceStyle: CSSProperties = {
  border: '1px solid rgba(226, 229, 226, 0.95)',
  background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.99), rgba(253, 253, 252, 0.98))',
  boxShadow: '0 16px 38px rgba(15, 23, 42, 0.06)',
};

const heroIconStyle: CSSProperties = {
  width: 58,
  height: 58,
  borderRadius: 8,
  display: 'grid',
  placeItems: 'center',
  color: '#2F8F2F',
  background:
    'radial-gradient(circle at 28% 20%, rgba(47, 143, 47, 0.10), transparent 38%), linear-gradient(135deg, rgba(255, 255, 255, 0.99), rgba(248, 249, 248, 0.98))',
  border: '1px solid rgba(226, 229, 226, 0.95)',
  boxShadow: '0 14px 34px rgba(15, 23, 42, 0.07)',
};

const iconTileStyle: CSSProperties = {
  width: 54,
  height: 54,
  borderRadius: 8,
  display: 'grid',
  placeItems: 'center',
  flexShrink: 0,
};

const emptyRowStyle: CSSProperties = {
  border: '1px solid #E4E7E4',
  background: 'linear-gradient(135deg, #FFFFFF, #FDFDFC)',
  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.035)',
};

const emptyIconStyle: CSSProperties = {
  width: 42,
  height: 42,
  borderRadius: 8,
  display: 'grid',
  placeItems: 'center',
  color: '#2F8F2F',
  background: '#EDF8EF',
};

const tableHeadStyle: CSSProperties = {
  background: 'linear-gradient(180deg, #FFFFFF, #F5F6F5)',
};

const tableThStyle: CSSProperties = {
  color: '#667085',
  fontSize: '0.72rem',
  fontWeight: 800,
  letterSpacing: 0,
  textTransform: 'uppercase',
};

const blockedCardStyle: CSSProperties = {
  borderColor: '#FED7AA',
  borderLeft: '3px solid #F97316',
  background: 'linear-gradient(135deg, #FFFDFA, #FFF7ED)',
};

export default function WarehouseDashboard() {
  const router = useRouter();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [pickTasks, setPickTasks] = useState<PickTask[]>([]);
  const [putawayBatches, setPutawayBatches] = useState<PutawayBatch[]>([]);
  const [loadingKpis, setLoadingKpis] = useState(true);
  const [loadingPick, setLoadingPick] = useState(true);
  const [loadingPutaway, setLoadingPutaway] = useState(true);
  const [issuing, setIssuing] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const c = await fetch('/api/batch-counts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          counts: [
            { key: 'incoming', collection: 'raw_material_orders', filter: { status: { _eq: 'ordered' } } },
            { key: 'qcPending', collection: 'batches', filter: { status: { _eq: 'qc_pending' } } },
            { key: 'approvedWaiting', collection: 'batches', filter: { status: { _eq: 'approved' } } },
            { key: 'stored', collection: 'batches', filter: { status: { _eq: 'stored_available' } } },
          ],
        }),
      }).then(async r => r.ok ? (await r.json())?.counts ?? {} : {}).catch(() => ({}));
      setCounts(c);
      setLoadingKpis(false);
    }
    load();
  }, []);

  useEffect(() => {
    fetch('/api/items/batches?filter[status][_eq]=approved&fields[]=id&fields[]=batch_number&fields[]=qty&fields[]=unit&fields[]=material_id&limit=8&sort[]=-id')
      .then(async r => r.ok ? (await r.json())?.data ?? [] : [])
      .then(setPutawayBatches)
      .catch(() => setPutawayBatches([]))
      .finally(() => setLoadingPutaway(false));
  }, []);

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
          order_number: order?.order_number ?? '-',
          product_name: order ? (productMap[order.product_id] ?? '-') : '-',
          material_request_id: mr?.id ?? '',
          request_number: mr?.request_number ?? '-',
          material_id: item.material_id,
          material_name: matMap[item.material_id] ?? item.material_id.slice(0, 8),
          requested_qty: item.requested_qty,
          unit: item.unit,
          available_batch_id: batch?.id ?? null,
          available_batch_number: batch?.batch_number ?? null,
          available_qty: batch?.qty ?? null,
          batch_location: batch?.current_location_id ? (locMap[batch.current_location_id] ?? '-') : null,
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

  const warehouseInsights = [
    n('approvedWaiting') > 0
      ? {
          title: 'Approved batches should be stored first',
          description: `${n('approvedWaiting')} QC-approved batch${n('approvedWaiting') === 1 ? ' needs' : 'es need'} a bin before it can be used by production.`,
          tone: 'watch' as const,
          href: '/warehouse/putaway',
          action: 'Assign bins',
        }
      : {
          title: 'No approved batches are waiting for storage',
          description: 'Putaway is clear. Keep an eye on QC-approved batches as they arrive from inspection.',
          tone: 'good' as const,
          href: '/warehouse/putaway',
          action: 'All clear',
        },
    pendingTasks.length > 0
      ? {
          title: 'Production materials are ready to send',
          description: `${pendingTasks.length} material line${pendingTasks.length === 1 ? ' has' : 's have'} available stock. Prioritize orders with the closest production due date.`,
          tone: 'info' as const,
          href: '/warehouse/production',
          action: 'Issue stock',
        }
      : blockedTasks.length > 0
      ? {
          title: 'Some production requests have no available batch',
          description: `${blockedTasks.length} material line${blockedTasks.length === 1 ? ' is' : 's are'} blocked. PPIC may need to expedite supply or wait for QC approval.`,
          tone: 'risk' as const,
          href: '/warehouse/production',
          action: 'Escalate',
        }
      : {
          title: 'No production material issue is waiting',
          description: 'Warehouse has no open material request requiring immediate issue right now.',
          tone: 'good' as const,
          href: '/warehouse/production',
          action: 'Monitor',
        },
    n('qcPending') > 0
      ? {
          title: 'QC queue affects warehouse space',
          description: `${n('qcPending')} batch${n('qcPending') === 1 ? ' is' : 'es are'} waiting for inspection. Keep quarantine and staging space available.`,
          tone: 'watch' as const,
          href: '/warehouse/batches',
          action: 'Monitor QC',
        }
      : {
          title: 'No batch is waiting for QC from warehouse view',
          description: 'Receiving can continue without adding pressure to the QC staging area.',
          tone: 'good' as const,
          href: '/warehouse/batches',
          action: 'Stable',
        },
  ];

  const kpiCards = [
    { label: 'Deliveries Expected', value: n('incoming'), icon: Truck, href: '/warehouse/incoming', link: 'View deliveries', accent: '#2F8F2F', soft: '#EAF7EC' },
    { label: 'Waiting for QC', value: n('qcPending'), icon: Hourglass, href: '/warehouse/batches', link: 'View batches', accent: '#3B82F6', soft: '#EEF5FF' },
    { label: 'Approved - Needs Storage', value: n('approvedWaiting'), icon: MapPin, href: '/warehouse/putaway', link: 'Go to putaway', accent: '#F97316', soft: '#FFF3E4' },
    { label: 'Stored - Available for Production', value: n('stored'), icon: PackageCheck, href: '/warehouse/batches', link: 'View inventory', accent: '#2F8F2F', soft: '#EAF7EC' },
  ];

  return (
    <Stack gap={22} className="w-full">
      <Group align="center" gap={18} className="max-sm:items-start">
        <Box style={heroIconStyle} className="max-sm:h-12 max-sm:w-12">
          <Truck size={28} strokeWidth={1.8} />
        </Box>
        <div>
          <Title order={1} fw={900} style={{ color: '#07142A', letterSpacing: 0, lineHeight: 1.05 }}>
            Warehouse Operations
          </Title>
          <Text size="sm" mt={8} style={{ color: '#667085' }}>
            Receive materials, manage QC flow, assign storage, send to production.
          </Text>
        </div>
      </Group>

      {loadingKpis ? (
        <DashboardLoading cards={4} graphPanels={0} queuePanels={2} />
      ) : (
        <>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing={16}>
            {kpiCards.map(({ label, value, icon: Icon, href, link, accent, soft }) => (
              <Paper
                key={label}
                p={22}
                radius={8}
                className="min-h-[132px] cursor-pointer transition duration-150 hover:-translate-y-0.5"
                onClick={() => router.push(href)}
                style={surfaceStyle}
              >
                <Group gap={18} align="flex-start" wrap="nowrap">
                  <Box style={{ ...iconTileStyle, backgroundColor: soft, color: accent }}>
                    <Icon size={25} strokeWidth={1.85} />
                  </Box>
                  <Stack gap={8} style={{ minWidth: 0, flex: 1 }}>
                    <Text size="sm" fw={750} style={{ color: '#354052', lineHeight: 1.25 }}>
                      {label}
                    </Text>
                    <Text
                      fw={900}
                      style={{
                        color: '#07142A',
                        fontSize: '2.2rem',
                        lineHeight: 1,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {value}
                    </Text>
                    <Text
                      size="xs"
                      fw={750}
                      className="mt-2.5 inline-flex items-center gap-2"
                      style={{ color: accent }}
                    >
                      {link} <ArrowRight size={14} aria-hidden="true" />
                    </Text>
                  </Stack>
                </Group>
              </Paper>
            ))}
          </SimpleGrid>

          <SimpleGrid cols={{ base: 1, lg: 2 }} spacing={18} style={{ alignItems: 'stretch' }}>
            <OperationalInsightPanel
              title="Warehouse Planning Insights"
              subtitle="Decision support for receiving, QC staging, storage, and production issue."
              items={warehouseInsights}
            />

            <Paper p={18} radius={8} style={surfaceStyle}>
              <Group justify="space-between" align="flex-start" mb={16}>
                <Text fw={850} size="md" style={{ color: '#07142A', letterSpacing: 0 }}>
                  Needs Storage Assignment
                </Text>
                <Anchor
                  href="/warehouse/putaway"
                  size="xs"
                  fw={800}
                  style={{
                    color: '#2F8F2F',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    lineHeight: 1,
                  }}
                >
                  Go to putaway <ArrowRight size={13} aria-hidden="true" style={{ display: 'block' }} />
                </Anchor>
              </Group>

              {loadingPutaway ? (
                <DashboardListLoading rows={2} />
              ) : putawayBatches.length === 0 ? (
                <Paper p="md" radius={8} style={emptyRowStyle}>
                  <Group gap={14} align="center">
                    <Box style={emptyIconStyle}>
                      <CheckCircle2 size={21} strokeWidth={2.1} />
                    </Box>
                    <div>
                      <Text fw={800} size="sm" style={{ color: '#07142A' }}>All batches stored</Text>
                      <Text size="xs" style={{ color: '#667085' }}>No approved batches waiting for a storage bin.</Text>
                    </div>
                  </Group>
                </Paper>
              ) : (
                <Stack gap={10}>
                  {putawayBatches.map(batch => (
                    <Paper key={batch.id} p="md" radius={8} style={emptyRowStyle}>
                      <Group justify="space-between" align="center" wrap="nowrap">
                        <div>
                          <Text fw={800} size="sm" style={{ color: '#07142A', fontFamily: 'monospace' }}>
                            {batch.batch_number}
                          </Text>
                          <Text size="xs" style={{ color: '#667085' }}>
                            {batch.qty} {batch.unit} cleared for storage
                          </Text>
                        </div>
                        <Button size="compact-sm" color="green" leftSection={<MapPin size={14} />} onClick={() => router.push('/warehouse/slotting')}>
                          Assign bin
                        </Button>
                      </Group>
                    </Paper>
                  ))}
                </Stack>
              )}
            </Paper>
          </SimpleGrid>

          <Paper p={18} radius={8} style={surfaceStyle}>
            <Group justify="space-between" align="center" mb={10}>
              <Group gap={10}>
                <Text fw={850} size="md" style={{ color: '#07142A', letterSpacing: 0 }}>
                  Materials Needed for Production
                </Text>
                {!loadingPick && pendingTasks.length > 0 && (
                  <Text size="xs" fw={800} style={{ color: '#2F8F2F' }}>
                    Ready to Send - {pendingTasks.length}
                  </Text>
                )}
              </Group>
            </Group>

            {loadingPick ? (
              <DashboardListLoading rows={3} />
            ) : pickTasks.length === 0 ? (
              <Paper p="md" radius={8} style={emptyRowStyle}>
                <Group gap={14} align="center">
                  <Box style={emptyIconStyle}>
                    <CheckCircle2 size={21} strokeWidth={2.1} />
                  </Box>
                  <div>
                    <Text fw={800} size="sm" style={{ color: '#07142A' }}>No materials need to be sent right now</Text>
                    <Text size="xs" style={{ color: '#667085' }}>Production has no open material requests waiting on the warehouse.</Text>
                  </div>
                </Group>
              </Paper>
            ) : (
              <Stack gap={14}>
                {pendingTasks.length > 0 && (
                  <Paper withBorder radius={8} style={{ borderColor: '#E2E8E2', overflow: 'hidden' }}>
                    <Table highlightOnHover highlightOnHoverColor="#F8FBF8">
                      <Table.Thead style={tableHeadStyle}>
                        <Table.Tr>
                          {['Order', 'Material', 'Batch', 'Location', 'Qty', 'Action'].map(header => (
                            <Table.Th key={header} style={tableThStyle}>{header}</Table.Th>
                          ))}
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {pendingTasks.map(task => (
                          <Table.Tr key={task.mr_item_id} style={{ height: 42 }}>
                            <Table.Td>
                              <Text
                                size="sm"
                                fw={750}
                                style={{ color: '#2F8F2F', cursor: 'pointer' }}
                                onClick={() => router.push(`/warehouse/production/${task.production_order_id}`)}
                              >
                                {task.order_number}
                              </Text>
                            </Table.Td>
                            <Table.Td><Text size="sm" style={{ color: '#344054' }}>{task.material_name}</Text></Table.Td>
                            <Table.Td><Text size="xs" style={{ color: '#667085', fontFamily: 'monospace' }}>{task.available_batch_number}</Text></Table.Td>
                            <Table.Td><Badge size="sm" color="green" variant="light">{task.batch_location ?? '-'}</Badge></Table.Td>
                            <Table.Td><Text size="sm" style={{ color: '#344054' }}>{task.available_qty} {task.unit}</Text></Table.Td>
                            <Table.Td>
                              <Button
                                size="compact-sm"
                                color="green"
                                leftSection={<Send size={13} />}
                                loading={issuing === task.mr_item_id}
                                onClick={() => issueBatch(task)}
                              >
                                Send to Production
                              </Button>
                            </Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  </Paper>
                )}

                {blockedTasks.length > 0 && (
                  <Paper p="md" radius={8} style={blockedCardStyle}>
                    <Group gap={8} mb={12} align="center">
                      <AlertTriangle size={16} color="#C2410C" />
                      <Text size="sm" fw={850} style={{ color: '#C2410C' }}>
                        No Stock Available - {blockedTasks.length} material{blockedTasks.length > 1 ? 's' : ''} blocked
                      </Text>
                    </Group>
                    <Stack gap={8}>
                      {blockedTasks.map(task => (
                        <Group key={task.mr_item_id} justify="space-between" wrap="nowrap">
                          <Text size="sm" style={{ color: '#344054' }}>{task.material_name}</Text>
                          <Group gap={16} wrap="nowrap">
                            <Text size="xs" style={{ color: '#667085' }}>{task.requested_qty} {task.unit}</Text>
                            <Text size="xs" style={{ color: '#667085' }}>Order: {task.order_number}</Text>
                          </Group>
                        </Group>
                      ))}
                    </Stack>
                  </Paper>
                )}
              </Stack>
            )}
          </Paper>
        </>
      )}
    </Stack>
  );
}
