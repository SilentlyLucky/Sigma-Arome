'use client';

import { Anchor, Badge, Box, Button, Group, Paper, SimpleGrid, Stack, Table, Text, Title } from '@mantine/core';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Hourglass,
  MapPin,
  PackageCheck,
  Package as PackageIcon,
  Truck,
} from 'lucide-react';
import { DashboardListLoading, DashboardLoading } from '@/components/ui/dashboard-loading';
import { OperationalInsightPanel } from '@/components/ui/operational-dashboard';
import type { CSSProperties } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface OrderTask {
  production_order_id: string;
  order_number: string;
  product_name: string;
  pending_lines: number;
  staged_lines: number;
  total_lines: number;
  unfulfillable_lines: number;
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

export default function WarehouseDashboard() {
  const router = useRouter();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [orderTasks, setOrderTasks] = useState<OrderTask[]>([]);
  const [putawayBatches, setPutawayBatches] = useState<PutawayBatch[]>([]);
  const [loadingKpis, setLoadingKpis] = useState(true);
  const [loadingProduction, setLoadingProduction] = useState(true);
  const [loadingPutaway, setLoadingPutaway] = useState(true);

  // ── KPI counts ──────────────────────────────────────────────────────────────
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

  // ── Putaway queue ────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/items/batches?filter[status][_eq]=approved&fields[]=id&fields[]=batch_number&fields[]=qty&fields[]=unit&fields[]=material_id&limit=8&sort[]=-id')
      .then(async r => r.ok ? (await r.json())?.data ?? [] : [])
      .then(setPutawayBatches)
      .catch(() => setPutawayBatches([]))
      .finally(() => setLoadingPutaway(false));
  }, []);

  // ── Production staging summary ──────────────────────────────────────────────
  const loadProduction = useCallback(async () => {
    setLoadingProduction(true);
    try {
      const ordersRes = await fetch(
        '/api/items/production_orders?filter[status][_eq]=released' +
        '&fields[]=id&fields[]=order_number&fields[]=product_id&limit=20&sort[]=-id'
      );
      const orders: Array<{ id: string; order_number: string; product_id: string }> = (await ordersRes.json())?.data ?? [];
      if (orders.length === 0) { setOrderTasks([]); return; }

      const productIds = [...new Set(orders.map(o => o.product_id))];
      const productsRes = await fetch(`/api/items/products?filter[id][_in]=${productIds.join(',')}&fields[]=id&fields[]=name&limit=50`);
      const productMap: Record<string, string> = {};
      for (const p of (await productsRes.json())?.data ?? []) productMap[p.id] = p.name;

      const orderIds = orders.map(o => o.id);
      const mrRes = await fetch(
        `/api/items/material_requests?filter[production_order_id][_in]=${orderIds.join(',')}` +
        `&fields[]=id&fields[]=production_order_id&limit=200`
      );
      const mrs: Array<{ id: string; production_order_id: string }> = (await mrRes.json())?.data ?? [];
      const mrToOrder: Record<string, string> = {};
      for (const mr of mrs) mrToOrder[mr.id] = mr.production_order_id;

      const counts: Record<string, { pending: number; staged: number; total: number; unfulfillable: number }> = {};
      for (const o of orders) counts[o.id] = { pending: 0, staged: 0, total: 0, unfulfillable: 0 };

      if (mrs.length > 0) {
        const mrIds = mrs.map(m => m.id);
        const itemsRes = await fetch(
          `/api/items/material_request_items?filter[material_request_id][_in]=${mrIds.join(',')}` +
          `&fields[]=material_request_id&fields[]=status&limit=2000`
        );
        const items: Array<{ material_request_id: string; status: string }> = (await itemsRes.json())?.data ?? [];
        for (const it of items) {
          const orderId = mrToOrder[it.material_request_id];
          if (!orderId || !counts[orderId]) continue;
          counts[orderId].total += 1;
          const s = it.status ?? 'pending';
          if (s === 'pending') counts[orderId].pending += 1;
          else if (s === 'unfulfillable') counts[orderId].unfulfillable += 1;
          else counts[orderId].staged += 1;
        }
      }

      setOrderTasks(orders
        .map(o => {
          const c = counts[o.id] ?? { pending: 0, staged: 0, total: 0, unfulfillable: 0 };
          return {
            production_order_id: o.id,
            order_number: o.order_number,
            product_name: productMap[o.product_id] ?? '—',
            pending_lines: c.pending,
            staged_lines: c.staged,
            total_lines: c.total,
            unfulfillable_lines: c.unfulfillable,
          };
        })
        .filter(t => t.total_lines > 0)
        .sort((a, b) => b.pending_lines - a.pending_lines)
      );
    } catch (err) {
      console.error('Failed to load production tasks:', err);
    } finally {
      setLoadingProduction(false);
    }
  }, []);

  useEffect(() => { loadProduction(); }, [loadProduction]);

  const n = (k: string) => counts[k] ?? 0;
  const pendingTotal = orderTasks.reduce((sum, t) => sum + t.pending_lines, 0);
  const blockedTotal = orderTasks.reduce((sum, t) => sum + t.unfulfillable_lines, 0);

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
    pendingTotal > 0
      ? {
          title: 'Production materials are ready to stage',
          description: `${pendingTotal} material line${pendingTotal === 1 ? ' has' : 's have'} a FEFO source picked. Stage them into a staging bin so logistics can confirm delivery.`,
          tone: 'info' as const,
          href: '/warehouse/production',
          action: 'Stage materials',
        }
      : blockedTotal > 0
      ? {
          title: 'Some production lines have no available stock',
          description: `${blockedTotal} material line${blockedTotal === 1 ? ' is' : 's are'} blocked. PPIC may need to expedite supply or wait for QC approval.`,
          tone: 'risk' as const,
          href: '/warehouse/production',
          action: 'Escalate',
        }
      : {
          title: 'No production staging is waiting',
          description: 'Warehouse has no open material request requiring immediate staging right now.',
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
            Receive materials, manage QC flow, assign storage, stage materials for production.
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
                className="role-clickable-card min-h-[132px] cursor-pointer"
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
              subtitle="Decision support for receiving, QC staging, storage, and production staging."
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
                  Production Orders Awaiting Staging
                </Text>
                {!loadingProduction && pendingTotal > 0 && (
                  <Text size="xs" fw={800} style={{ color: '#2F8F2F' }}>
                    {pendingTotal} line{pendingTotal === 1 ? '' : 's'} ready
                  </Text>
                )}
              </Group>
              <Anchor
                href="/warehouse/production"
                size="xs"
                fw={800}
                style={{ color: '#2F8F2F', display: 'inline-flex', alignItems: 'center', gap: 6, lineHeight: 1 }}
              >
                Open all <ArrowRight size={13} aria-hidden="true" style={{ display: 'block' }} />
              </Anchor>
            </Group>

            {loadingProduction ? (
              <DashboardListLoading rows={3} />
            ) : orderTasks.length === 0 ? (
              <Paper p="md" radius={8} style={emptyRowStyle}>
                <Group gap={14} align="center">
                  <Box style={emptyIconStyle}>
                    <CheckCircle2 size={21} strokeWidth={2.1} />
                  </Box>
                  <div>
                    <Text fw={800} size="sm" style={{ color: '#07142A' }}>No staging needed right now</Text>
                    <Text size="xs" style={{ color: '#667085' }}>No released production orders are waiting on materials.</Text>
                  </div>
                </Group>
              </Paper>
            ) : (
              <Paper withBorder radius={8} style={{ borderColor: '#E2E8E2', overflow: 'hidden' }}>
                <Table highlightOnHover highlightOnHoverColor="#F8FBF8">
                  <Table.Thead style={tableHeadStyle}>
                    <Table.Tr>
                      {['Order', 'Product', 'Materials Staged', 'Issues', 'Action'].map(header => (
                        <Table.Th key={header} style={tableThStyle}>{header}</Table.Th>
                      ))}
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {orderTasks.map(task => (
                      <Table.Tr key={task.production_order_id} style={{ height: 42 }}>
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
                        <Table.Td><Text size="sm" style={{ color: '#344054' }}>{task.product_name}</Text></Table.Td>
                        <Table.Td>
                          <Text size="sm" style={{ color: '#344054' }}>{task.staged_lines}/{task.total_lines}</Text>
                        </Table.Td>
                        <Table.Td>
                          {task.unfulfillable_lines > 0 ? (
                            <Badge size="sm" color="red" variant="light" leftSection={<AlertTriangle size={11} />}>
                              {task.unfulfillable_lines} blocked
                            </Badge>
                          ) : task.pending_lines > 0 ? (
                            <Badge size="sm" color="orange" variant="light">{task.pending_lines} pending</Badge>
                          ) : (
                            <Badge size="sm" color="green" variant="light">All staged</Badge>
                          )}
                        </Table.Td>
                        <Table.Td>
                          <Button
                            size="compact-sm"
                            color="green"
                            leftSection={<PackageIcon size={13} />}
                            onClick={() => router.push(`/warehouse/production/${task.production_order_id}`)}
                          >
                            Stage Materials
                          </Button>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Paper>
            )}
          </Paper>
        </>
      )}
    </Stack>
  );
}
