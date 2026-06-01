'use client';

import { Stack, Title, Text, Group, Badge, Button, Alert, Table, Paper, Loader } from '@mantine/core';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { notifications } from '@mantine/notifications';
import { IconTruck, IconCheck } from '@tabler/icons-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface MaterialLine {
  id: string;
  material_name: string;
  requested_qty: number;
  unit: string;
  status: string;
  staging_location_code: string | null;
  delivered_qty: number | null;
  delivery_notes: string | null;
}

interface OrderInfo {
  order_number: string;
  status: string;
  product_name: string;
  planned_qty: number;
  unit: string;
}

const LINE_STATUS_COLORS: Record<string, string> = {
  pending: 'gray', staged: 'cyan', delivered: 'blue', received: 'green', unfulfillable: 'red',
};

export default function LogisticDeliveryDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const orderId = id as string;

  const [order, setOrder] = useState<OrderInfo | null>(null);
  const [lines, setLines] = useState<MaterialLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

  // local edits per line
  const [edits, setEdits] = useState<Record<string, { qty: number; notes: string }>>({});

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
        const pr = await fetch(`/api/items/products/${orderData.product_id}?fields[]=name`);
        productName = (await pr.json())?.data?.name ?? orderData.product_id;
      }

      setOrder({
        order_number: orderData.order_number,
        status: orderData.status,
        product_name: productName,
        planned_qty: orderData.planned_qty,
        unit: orderData.unit,
      });

      const mrRes = await fetch(`/api/items/material_requests?filter[production_order_id][_eq]=${orderId}&fields[]=id&limit=10`);
      const mrs: Array<{ id: string }> = (await mrRes.json())?.data ?? [];
      if (mrs.length === 0) { setLines([]); return; }

      const mrIds = mrs.map(m => m.id).join(',');
      const itemsRes = await fetch(
        `/api/items/material_request_items?filter[material_request_id][_in]=${mrIds}` +
        `&fields[]=id&fields[]=material_id&fields[]=requested_qty&fields[]=unit&fields[]=status` +
        `&fields[]=staging_location_id&fields[]=delivered_qty&fields[]=delivery_notes&limit=200`
      );
      const items: Array<{ id: string; material_id: string; requested_qty: number; unit: string; status: string; staging_location_id: string | null; delivered_qty: number | null; delivery_notes: string | null }> = (await itemsRes.json())?.data ?? [];

      const matIds = [...new Set(items.map(i => i.material_id))];
      const matsRes = await fetch(`/api/items/raw_materials?filter[id][_in]=${matIds.join(',')}&fields[]=id&fields[]=name&limit=200`);
      const matMap: Record<string, string> = {};
      for (const m of (await matsRes.json())?.data ?? []) matMap[m.id] = m.name;

      const locIds = items.map(i => i.staging_location_id).filter(Boolean) as string[];
      const locMap: Record<string, string> = {};
      if (locIds.length > 0) {
        const lr = await fetch(`/api/items/warehouse_locations?filter[id][_in]=${[...new Set(locIds)].join(',')}&fields[]=id&fields[]=location_code&limit=200`);
        for (const l of (await lr.json())?.data ?? []) locMap[l.id] = l.location_code;
      }

      const newLines = items.map(i => ({
        id: i.id,
        material_name: matMap[i.material_id] ?? i.material_id.slice(0, 8),
        requested_qty: i.requested_qty,
        unit: i.unit,
        status: i.status ?? 'pending',
        staging_location_code: i.staging_location_id ? (locMap[i.staging_location_id] ?? null) : null,
        delivered_qty: i.delivered_qty,
        delivery_notes: i.delivery_notes,
      }));
      setLines(newLines);

      // Pre-fill edits with requested_qty for staged rows
      setEdits(prev => {
        const next = { ...prev };
        for (const l of newLines) {
          if (l.status === 'staged' && !next[l.id]) {
            next[l.id] = { qty: l.requested_qty, notes: '' };
          }
        }
        return next;
      });
    } catch (err) {
      console.error('Failed to load delivery detail:', err);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => { load(); }, [load]);

  const stagedLines = lines.filter(l => l.status === 'staged');

  const confirmAll = async () => {
    if (stagedLines.length === 0) return;
    setConfirming(true);
    try {
      const payload = {
        lines: stagedLines.map(l => ({
          mr_item_id: l.id,
          delivered_qty: edits[l.id]?.qty ?? l.requested_qty,
          delivery_notes: edits[l.id]?.notes || undefined,
        })),
      };
      const res = await fetch('/api/production/deliver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      const failures = (result?.results ?? []).filter((r: { ok: boolean }) => !r.ok);
      if (failures.length > 0) {
        notifications.show({ title: 'Partial failure', message: `${failures.length} line(s) failed to confirm.`, color: 'orange' });
      } else {
        notifications.show({ title: 'Delivered', message: 'Materials marked as delivered. Production will confirm receipt.', color: 'green' });
      }
      await load();
    } catch (err) {
      notifications.show({ title: 'Error', message: err instanceof Error ? err.message : 'Failed', color: 'red' });
    } finally {
      setConfirming(false);
    }
  };

  if (loading) return <Group justify="center" py="xl"><Loader /></Group>;
  if (!order) return <Alert color="red">Production order not found.</Alert>;

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-start">
        <div>
          <Title order={2}>Confirm Delivery — {order.order_number}</Title>
          <Text c="dimmed" size="sm">{order.product_name} | {order.planned_qty} {order.unit}</Text>
        </div>
      </Group>

      <Paper p="md" radius="md" withBorder>
        <Text fw={600} size="sm" mb="sm">Materials at Staging</Text>
        {lines.length === 0 ? (
          <Alert color="blue" variant="light">No material request items found.</Alert>
        ) : (
          <Table withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Material</Table.Th>
                <Table.Th>Requested</Table.Th>
                <Table.Th>Staging Bin</Table.Th>
                <Table.Th>Delivered Qty</Table.Th>
                <Table.Th>Notes</Table.Th>
                <Table.Th>Status</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {lines.map(line => {
                const isStaged = line.status === 'staged';
                const edit = edits[line.id] ?? { qty: line.requested_qty, notes: '' };
                return (
                  <Table.Tr key={line.id}>
                    <Table.Td><Text size="sm">{line.material_name}</Text></Table.Td>
                    <Table.Td><Text size="sm">{line.requested_qty} {line.unit}</Text></Table.Td>
                    <Table.Td>
                      {line.staging_location_code ? (
                        <Badge size="sm" color="cyan" variant="light">{line.staging_location_code}</Badge>
                      ) : <Text size="xs" c="dimmed">—</Text>}
                    </Table.Td>
                    <Table.Td>
                      {isStaged ? (
                        <Input
                          type="float"
                          value={edit.qty}
                          onChange={(v) => setEdits(p => ({ ...p, [line.id]: { ...edit, qty: typeof v === 'number' ? v : parseFloat(String(v ?? '')) || 0 } }))}
                        />
                      ) : (
                        <Text size="sm">{line.delivered_qty ?? '—'} {line.unit}</Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      {isStaged ? (
                        <Textarea
                          value={edit.notes}
                          onChange={(v) => setEdits(p => ({ ...p, [line.id]: { ...edit, notes: String(v ?? '') } }))}
                          placeholder="Optional"
                        />
                      ) : (
                        <Text size="xs" c="dimmed">{line.delivery_notes ?? '—'}</Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Badge size="sm" color={LINE_STATUS_COLORS[line.status] ?? 'gray'} variant="light">
                        {line.status}
                      </Badge>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        )}
      </Paper>

      <Group>
        <Button
          color="blue"
          leftSection={<IconTruck size={16} />}
          loading={confirming}
          disabled={stagedLines.length === 0}
          onClick={confirmAll}
        >
          Confirm Delivery for {stagedLines.length} line{stagedLines.length !== 1 ? 's' : ''}
        </Button>
        <Text size="xs" c="dimmed">
          Production will then confirm receipt to start the order.
        </Text>
      </Group>

      {stagedLines.length === 0 && lines.every(l => ['delivered', 'received'].includes(l.status)) && (
        <Alert color="green" variant="light" icon={<IconCheck size={14} />}>
          All materials delivered. Production must confirm receipt next.
        </Alert>
      )}

      <Group>
        <Button variant="subtle" onClick={() => router.push('/logistic/deliveries')}>← Back</Button>
      </Group>
    </Stack>
  );
}
