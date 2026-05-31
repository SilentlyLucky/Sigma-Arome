'use client';

import { Stack, Title, Text, Group, Badge, Paper, Loader, Alert, Table, Button, Progress } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { IconRefresh, IconPlayerPlay, IconCircleCheck, IconAlertTriangle } from '@tabler/icons-react';

interface OrderRow {
  id: string;
  order_number: string;
  status: string;
  product_name: string;
  planned_qty: number;
  unit: string;
  total_lines: number;
  fully_issued_lines: number;
  all_issued: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  released: 'indigo',
  in_progress: 'violet',
};
const STATUS_LABELS: Record<string, string> = {
  released: 'Released',
  in_progress: 'In Progress',
};

export default function WarehouseProductionListPage() {
  const router = useRouter();
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const ordersRes = await fetch(
        '/api/items/production_orders' +
        '?filter[status][_in]=released,in_progress' +
        '&fields[]=id&fields[]=order_number&fields[]=status&fields[]=product_id' +
        '&fields[]=planned_qty&fields[]=unit&limit=200&sort[]=-id'
      );
      const orders: Array<{
        id: string;
        order_number: string;
        status: string;
        product_id: string;
        planned_qty: number;
        unit: string;
      }> = (await ordersRes.json())?.data ?? [];

      if (orders.length === 0) { setRows([]); return; }

      // Resolve product names
      const productIds = [...new Set(orders.map(o => o.product_id).filter(Boolean))];
      const productMap: Record<string, string> = {};
      if (productIds.length > 0) {
        const prodRes = await fetch(
          `/api/items/products?filter[id][_in]=${productIds.join(',')}&fields[]=id&fields[]=name&limit=200`
        );
        for (const p of (await prodRes.json())?.data ?? []) productMap[p.id] = p.name;
      }

      // Resolve material request items per order
      const orderIds = orders.map(o => o.id);
      const mrRes = await fetch(
        `/api/items/material_requests?filter[production_order_id][_in]=${orderIds.join(',')}` +
        `&fields[]=id&fields[]=production_order_id&limit=400`
      );
      const mrs: Array<{ id: string; production_order_id: string }> = (await mrRes.json())?.data ?? [];
      const mrToOrder: Record<string, string> = {};
      for (const mr of mrs) mrToOrder[mr.id] = mr.production_order_id;

      const linesByOrder: Record<string, { total: number; fullyIssued: number }> = {};
      for (const o of orders) linesByOrder[o.id] = { total: 0, fullyIssued: 0 };

      if (mrs.length > 0) {
        const mrIds = mrs.map(m => m.id);
        const itemsRes = await fetch(
          `/api/items/material_request_items?filter[material_request_id][_in]=${mrIds.join(',')}` +
          `&fields[]=material_request_id&fields[]=requested_qty&fields[]=issued_qty&limit=2000`
        );
        const items: Array<{ material_request_id: string; requested_qty: number; issued_qty: number }> =
          (await itemsRes.json())?.data ?? [];

        for (const item of items) {
          const orderId = mrToOrder[item.material_request_id];
          if (!orderId || !linesByOrder[orderId]) continue;
          linesByOrder[orderId].total += 1;
          if ((item.issued_qty ?? 0) >= item.requested_qty) {
            linesByOrder[orderId].fullyIssued += 1;
          }
        }
      }

      setRows(orders.map(o => {
        const counts = linesByOrder[o.id] ?? { total: 0, fullyIssued: 0 };
        return {
          id: o.id,
          order_number: o.order_number,
          status: o.status,
          product_name: productMap[o.product_id] ?? o.product_id?.slice(0, 8) ?? '—',
          planned_qty: o.planned_qty,
          unit: o.unit,
          total_lines: counts.total,
          fully_issued_lines: counts.fullyIssued,
          all_issued: counts.total > 0 && counts.total === counts.fullyIssued,
        };
      }));
    } catch (err) {
      console.error('Failed to load production orders:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const releasedRows = rows.filter(r => r.status === 'released');
  const inProgressRows = rows.filter(r => r.status === 'in_progress');

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-start">
        <div>
          <Title order={2}>Production Orders</Title>
          <Text c="dimmed" size="sm">
            Active orders waiting for materials to be issued or already running. Open an order to issue
            its materials and start production.
          </Text>
        </div>
        <Button
          variant="light"
          leftSection={<IconRefresh size={14} />}
          onClick={load}
          loading={loading}
        >
          Refresh
        </Button>
      </Group>

      {loading ? (
        <Group justify="center" py="xl"><Loader /></Group>
      ) : rows.length === 0 ? (
        <Alert color="green" variant="light" icon={<IconCircleCheck size={16} />}>
          No active production orders right now. New orders will appear here once PPIC releases them.
        </Alert>
      ) : (
        <>
          <Section
            title="Ready for Picking"
            description="Orders waiting for the warehouse to issue materials and start production."
            rows={releasedRows}
            onOpen={(id) => router.push(`/warehouse/production/${id}`)}
            emptyMessage="No orders waiting on materials."
          />
          <Section
            title="In Progress"
            description="Orders the production team is actively running."
            rows={inProgressRows}
            onOpen={(id) => router.push(`/warehouse/production/${id}`)}
            emptyMessage="No orders in progress."
          />
        </>
      )}
    </Stack>
  );
}

function Section({
  title,
  description,
  rows,
  onOpen,
  emptyMessage,
}: {
  title: string;
  description: string;
  rows: OrderRow[];
  onOpen: (id: string) => void;
  emptyMessage: string;
}) {
  return (
    <Paper p="md" radius="md" withBorder>
      <Stack gap="xs">
        <div>
          <Text fw={600}>{title}</Text>
          <Text c="dimmed" size="xs">{description}</Text>
        </div>

        {rows.length === 0 ? (
          <Text c="dimmed" size="sm" py="sm">{emptyMessage}</Text>
        ) : (
          <Table withTableBorder withColumnBorders highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Order</Table.Th>
                <Table.Th>Product</Table.Th>
                <Table.Th>Planned Qty</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Materials Issued</Table.Th>
                <Table.Th>Action</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rows.map(row => {
                const pct = row.total_lines === 0 ? 0 : Math.round((row.fully_issued_lines / row.total_lines) * 100);
                const ready = row.status === 'released' && row.all_issued;
                return (
                  <Table.Tr key={row.id} style={{ cursor: 'pointer' }} onClick={() => onOpen(row.id)}>
                    <Table.Td><Text size="sm" fw={500}>{row.order_number}</Text></Table.Td>
                    <Table.Td><Text size="sm">{row.product_name}</Text></Table.Td>
                    <Table.Td><Text size="sm">{row.planned_qty} {row.unit}</Text></Table.Td>
                    <Table.Td>
                      <Badge color={STATUS_COLORS[row.status] ?? 'gray'} variant="light">
                        {STATUS_LABELS[row.status] ?? row.status}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      {row.total_lines === 0 ? (
                        <Text size="xs" c="dimmed">No items</Text>
                      ) : (
                        <Stack gap={4}>
                          <Group gap={6} wrap="nowrap">
                            <Progress
                              value={pct}
                              color={pct === 100 ? 'green' : 'orange'}
                              size="sm"
                              style={{ flex: 1 }}
                            />
                            <Text size="xs" c="dimmed" fw={500}>
                              {row.fully_issued_lines}/{row.total_lines}
                            </Text>
                          </Group>
                          {pct < 100 && row.status === 'released' && (
                            <Group gap={4} wrap="nowrap">
                              <IconAlertTriangle size={12} color="orange" />
                              <Text size="xs" c="orange">Issue all materials before starting</Text>
                            </Group>
                          )}
                        </Stack>
                      )}
                    </Table.Td>
                    <Table.Td onClick={(e) => e.stopPropagation()}>
                      {row.status === 'released' ? (
                        <Button
                          size="xs"
                          color={ready ? 'violet' : 'gray'}
                          variant={ready ? 'filled' : 'light'}
                          leftSection={<IconPlayerPlay size={12} />}
                          onClick={() => onOpen(row.id)}
                        >
                          {ready ? 'Start Production' : 'Open / Issue'}
                        </Button>
                      ) : (
                        <Button size="xs" variant="subtle" onClick={() => onOpen(row.id)}>
                          View
                        </Button>
                      )}
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        )}
      </Stack>
    </Paper>
  );
}
