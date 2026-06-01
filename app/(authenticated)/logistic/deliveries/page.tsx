'use client';

import { Stack, Title, Text, Group, Paper, Loader, Alert, Table, Button, Progress } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { IconRefresh, IconTruck, IconCircleCheck } from '@tabler/icons-react';

interface OrderRow {
  id: string;
  order_number: string;
  product_name: string;
  total_lines: number;
  staged_lines: number;
  delivered_lines: number;
  ready_to_deliver: boolean;
}

export default function LogisticDeliveriesPage() {
  const router = useRouter();
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const ordersRes = await fetch(
        '/api/items/production_orders?filter[status][_eq]=released' +
        '&fields[]=id&fields[]=order_number&fields[]=product_id&limit=200'
      );
      const orders: Array<{ id: string; order_number: string; product_id: string }> = (await ordersRes.json())?.data ?? [];
      if (orders.length === 0) { setRows([]); return; }

      const productIds = [...new Set(orders.map(o => o.product_id))];
      const productsRes = await fetch(`/api/items/products?filter[id][_in]=${productIds.join(',')}&fields[]=id&fields[]=name&limit=200`);
      const productMap: Record<string, string> = {};
      for (const p of (await productsRes.json())?.data ?? []) productMap[p.id] = p.name;

      const orderIds = orders.map(o => o.id);
      const mrRes = await fetch(
        `/api/items/material_requests?filter[production_order_id][_in]=${orderIds.join(',')}` +
        `&fields[]=id&fields[]=production_order_id&limit=400`
      );
      const mrs: Array<{ id: string; production_order_id: string }> = (await mrRes.json())?.data ?? [];
      const mrToOrder: Record<string, string> = {};
      for (const mr of mrs) mrToOrder[mr.id] = mr.production_order_id;

      const counts: Record<string, { total: number; staged: number; delivered: number }> = {};
      for (const o of orders) counts[o.id] = { total: 0, staged: 0, delivered: 0 };

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
          if (it.status === 'staged') counts[orderId].staged += 1;
          if (it.status === 'delivered' || it.status === 'received') counts[orderId].delivered += 1;
        }
      }

      setRows(orders
        .map(o => {
          const c = counts[o.id] ?? { total: 0, staged: 0, delivered: 0 };
          return {
            id: o.id,
            order_number: o.order_number,
            product_name: productMap[o.product_id] ?? '—',
            total_lines: c.total,
            staged_lines: c.staged,
            delivered_lines: c.delivered,
            ready_to_deliver: c.staged > 0,
          };
        })
        .filter(r => r.total_lines > 0 && (r.staged_lines > 0 || r.delivered_lines > 0))
        .sort((a, b) => Number(b.ready_to_deliver) - Number(a.ready_to_deliver))
      );
    } catch (err) {
      console.error('Failed to load deliveries:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const ready = rows.filter(r => r.ready_to_deliver);
  const fullyDelivered = rows.filter(r => !r.ready_to_deliver && r.delivered_lines === r.total_lines);

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-start">
        <div>
          <Title order={2}>Production Deliveries</Title>
          <Text c="dimmed" size="sm">
            Confirm delivery of staged materials to the production floor.
            Materials must be staged by Warehouse before they appear here.
          </Text>
        </div>
        <Button variant="light" leftSection={<IconRefresh size={14} />} onClick={load} loading={loading}>
          Refresh
        </Button>
      </Group>

      {loading ? (
        <Group justify="center" py="xl"><Loader /></Group>
      ) : rows.length === 0 ? (
        <Alert color="blue" variant="light" icon={<IconCircleCheck size={16} />}>
          Nothing to deliver right now. Materials staged by Warehouse will appear here.
        </Alert>
      ) : (
        <>
          <Section
            title="Ready to Deliver"
            description="At least one line is staged and ready for delivery confirmation."
            rows={ready}
            onOpen={(id) => router.push(`/logistic/deliveries/${id}`)}
            emptyMessage="No staged materials waiting for delivery."
          />
          <Section
            title="Delivered (in flight)"
            description="Already confirmed delivered — production will receive next."
            rows={fullyDelivered}
            onOpen={(id) => router.push(`/logistic/deliveries/${id}`)}
            emptyMessage="No fully delivered orders."
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
                <Table.Th>Staged</Table.Th>
                <Table.Th>Delivered</Table.Th>
                <Table.Th>Action</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rows.map(row => {
                const stagedPct = row.total_lines === 0 ? 0 : Math.round((row.staged_lines / row.total_lines) * 100);
                const deliveredPct = row.total_lines === 0 ? 0 : Math.round((row.delivered_lines / row.total_lines) * 100);
                return (
                  <Table.Tr key={row.id} style={{ cursor: 'pointer' }} onClick={() => onOpen(row.id)}>
                    <Table.Td><Text size="sm" fw={500}>{row.order_number}</Text></Table.Td>
                    <Table.Td><Text size="sm">{row.product_name}</Text></Table.Td>
                    <Table.Td>
                      <Group gap={6} wrap="nowrap">
                        <Progress value={stagedPct} color="cyan" size="sm" style={{ width: 80 }} />
                        <Text size="xs" c="dimmed">{row.staged_lines}/{row.total_lines}</Text>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Group gap={6} wrap="nowrap">
                        <Progress value={deliveredPct} color="green" size="sm" style={{ width: 80 }} />
                        <Text size="xs" c="dimmed">{row.delivered_lines}/{row.total_lines}</Text>
                      </Group>
                    </Table.Td>
                    <Table.Td onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="xs"
                        color={row.ready_to_deliver ? 'blue' : 'gray'}
                        variant={row.ready_to_deliver ? 'filled' : 'light'}
                        leftSection={<IconTruck size={12} />}
                        onClick={() => onOpen(row.id)}
                      >
                        {row.ready_to_deliver ? 'Confirm Delivery' : 'View'}
                      </Button>
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
