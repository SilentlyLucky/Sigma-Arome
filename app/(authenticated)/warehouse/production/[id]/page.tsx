'use client';

import {
  Stack, Title, Text, Group, Badge, Button, Alert, Table, Paper, Loader, Tooltip,
} from '@mantine/core';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { notifications } from '@mantine/notifications';
import { IconPlayerPlay, IconAlertTriangle, IconCheck } from '@tabler/icons-react';

const STATUS_COLORS: Record<string, string> = {
  released: 'indigo', in_progress: 'violet', completed: 'teal',
  waiting_issue: 'orange', on_hold: 'orange', cancelled: 'red',
};
const STATUS_LABELS: Record<string, string> = {
  released: 'Released', in_progress: 'In Progress', completed: 'Completed',
  waiting_issue: 'Waiting Issue', on_hold: 'On Hold', cancelled: 'Cancelled',
};

interface MaterialLine {
  id: string;
  material_name: string;
  requested_qty: number;
  issued_qty: number;
  unit: string;
  shortage_qty: number | null;
}

interface OrderInfo {
  order_number: string;
  status: string;
  product_name: string;
  planned_qty: number;
  unit: string;
}

export default function WOProductionDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const orderId = id as string;
  const [order, setOrder] = useState<OrderInfo | null>(null);
  const [lines, setLines] = useState<MaterialLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const orderRes = await fetch(
        `/api/items/production_orders/${orderId}?fields[]=order_number&fields[]=status&fields[]=product_id&fields[]=planned_qty&fields[]=unit`
      );
      const orderData = (await orderRes.json())?.data;
      if (!orderData) return;

      let productName = orderData.product_id;
      if (orderData.product_id) {
        const prodRes = await fetch(`/api/items/products/${orderData.product_id}?fields[]=name`);
        productName = (await prodRes.json())?.data?.name ?? orderData.product_id;
      }

      setOrder({
        order_number: orderData.order_number,
        status: orderData.status,
        product_name: productName,
        planned_qty: orderData.planned_qty,
        unit: orderData.unit,
      });

      const mrRes = await fetch(
        `/api/items/material_requests?filter[production_order_id][_eq]=${orderId}&fields[]=id&limit=10`
      );
      const mrs: Array<{ id: string }> = (await mrRes.json())?.data ?? [];
      if (mrs.length === 0) { setLines([]); return; }

      const mrIds = mrs.map(m => m.id).join(',');
      const itemsRes = await fetch(
        `/api/items/material_request_items?filter[material_request_id][_in]=${mrIds}` +
        `&fields[]=id&fields[]=material_id&fields[]=requested_qty&fields[]=issued_qty&fields[]=unit&fields[]=shortage_qty&limit=200`
      );
      const items: Array<{ id: string; material_id: string; requested_qty: number; issued_qty: number; unit: string; shortage_qty: number | null }> =
        (await itemsRes.json())?.data ?? [];

      if (items.length === 0) { setLines([]); return; }

      const matIds = [...new Set(items.map(i => i.material_id))].join(',');
      const matsRes = await fetch(`/api/items/raw_materials?filter[id][_in]=${matIds}&fields[]=id&fields[]=name&limit=200`);
      const matMap: Record<string, string> = {};
      for (const m of (await matsRes.json())?.data ?? []) matMap[m.id] = m.name;

      setLines(items.map(i => ({
        id: i.id,
        material_name: matMap[i.material_id] ?? i.material_id.slice(0, 8),
        requested_qty: i.requested_qty,
        issued_qty: i.issued_qty ?? 0,
        unit: i.unit,
        shortage_qty: i.shortage_qty,
      })));
    } catch (err) {
      console.error('Failed to load WO detail:', err);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => { load(); }, [load]);

  const unfulfilledLines = lines.filter(l => (l.issued_qty ?? 0) < l.requested_qty);
  const allIssued = lines.length > 0 && unfulfilledLines.length === 0;

  const startProduction = async () => {
    setStarting(true);
    try {
      const res = await fetch(`/api/items/production_orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'in_progress' }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.errors?.[0]?.message ?? 'Failed to start production');
      }
      notifications.show({ title: 'Production Started', message: 'Order is now in progress.', color: 'green' });
      router.push('/warehouse');
    } catch (err) {
      notifications.show({ title: 'Error', message: err instanceof Error ? err.message : 'Failed', color: 'red' });
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return <Group justify="center" py="xl"><Loader /></Group>;
  }

  if (!order) {
    return <Alert color="red">Production order not found.</Alert>;
  }

  const tooltipLabel = unfulfilledLines.length > 0
    ? `Cannot start: ${unfulfilledLines.map(l => `${l.material_name} (${l.issued_qty}/${l.requested_qty} ${l.unit})`).join(', ')}`
    : '';

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-start">
        <div>
          <Title order={2}>Production Order {order.order_number}</Title>
          <Text c="dimmed" size="sm">{order.product_name} | {order.planned_qty} {order.unit}</Text>
        </div>
        <Badge size="lg" color={STATUS_COLORS[order.status] ?? 'gray'} variant="light">
          {STATUS_LABELS[order.status] ?? order.status}
        </Badge>
      </Group>

      <Paper p="md" radius="md" withBorder>
        <Text fw={600} size="sm" mb="sm">Materials to Issue</Text>
        {lines.length === 0 ? (
          <Alert color="blue" variant="light">No material request items found for this order.</Alert>
        ) : (
          <Table withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Material</Table.Th>
                <Table.Th>Required</Table.Th>
                <Table.Th>Issued</Table.Th>
                <Table.Th>Remaining</Table.Th>
                <Table.Th>Status</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {lines.map(line => {
                const remaining = line.requested_qty - (line.issued_qty ?? 0);
                const done = remaining <= 0;
                return (
                  <Table.Tr
                    key={line.id}
                    style={!done ? { backgroundColor: 'var(--mantine-color-red-0)' } : undefined}
                  >
                    <Table.Td><Text size="sm">{line.material_name}</Text></Table.Td>
                    <Table.Td><Text size="sm">{line.requested_qty} {line.unit}</Text></Table.Td>
                    <Table.Td><Text size="sm">{line.issued_qty ?? 0} {line.unit}</Text></Table.Td>
                    <Table.Td>
                      {done
                        ? <Text size="sm" c="dimmed">—</Text>
                        : <Text size="sm" c="red" fw={600}>{remaining} {line.unit}</Text>}
                    </Table.Td>
                    <Table.Td>
                      {done
                        ? <Badge size="xs" color="green" variant="light"><IconCheck size={10} /> Done</Badge>
                        : <Badge size="xs" color="orange" variant="light"><IconAlertTriangle size={10} /> Remaining</Badge>}
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        )}
      </Paper>

      {order.status === 'released' && (
        <Group>
          <Tooltip
            label={tooltipLabel}
            disabled={allIssued}
            multiline
            maw={320}
          >
            <Button
              leftSection={<IconPlayerPlay size={16} />}
              color="violet"
              loading={starting}
              disabled={!allIssued}
              onClick={startProduction}
            >
              Start Production
            </Button>
          </Tooltip>
          {!allIssued && (
            <Text size="xs" c="dimmed">
              {unfulfilledLines.length} material{unfulfilledLines.length !== 1 ? 's' : ''} not fully issued yet.
            </Text>
          )}
        </Group>
      )}

      {order.status === 'in_progress' && (
        <Alert color="violet" variant="light">Production is in progress. The production team will mark it complete.</Alert>
      )}
      {order.status === 'completed' && (
        <Alert color="teal" variant="light">Production is complete.</Alert>
      )}

      <Group>
        <Button variant="subtle" onClick={() => router.push('/warehouse')}>← Back to Warehouse</Button>
      </Group>
    </Stack>
  );
}
