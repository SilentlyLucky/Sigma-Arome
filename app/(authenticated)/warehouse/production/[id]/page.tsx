'use client';

import {
  Stack, Title, Text, Group, Badge, Button, Alert, Table, Paper, Loader, Tooltip,
} from '@mantine/core';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { notifications } from '@mantine/notifications';
import { IconPackage, IconAlertTriangle, IconCheck } from '@tabler/icons-react';
import { SelectDropdown } from '@/components/ui/select-dropdown';
import { useStagingLocations } from '@/lib/hooks/useStagingLocations';

const STATUS_COLORS: Record<string, string> = {
  released: 'indigo', in_progress: 'violet', completed: 'teal',
  waiting_issue: 'orange', on_hold: 'orange', cancelled: 'red',
};
const STATUS_LABELS: Record<string, string> = {
  released: 'Released', in_progress: 'In Progress', completed: 'Completed',
  waiting_issue: 'Waiting Issue', on_hold: 'On Hold', cancelled: 'Cancelled',
};
const LINE_STATUS_COLORS: Record<string, string> = {
  pending: 'gray',
  staged: 'blue',
  delivered: 'cyan',
  received: 'green',
  unfulfillable: 'red',
};
const LINE_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending pick',
  staged: 'Staged',
  delivered: 'Delivered',
  received: 'Received',
  unfulfillable: 'No stock',
};

interface MaterialLine {
  id: string;
  material_name: string;
  requested_qty: number;
  unit: string;
  status: string;
  source_batch_number: string | null;
  source_location_code: string | null;
  staging_location_code: string | null;
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
  const [stagingByLine, setStagingByLine] = useState<Record<string, string>>({});
  const [stagingInFlight, setStagingInFlight] = useState<string | null>(null);

  const { locations: stagingLocations, loading: stagingLoading } = useStagingLocations();

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
        `&fields[]=id&fields[]=material_id&fields[]=requested_qty&fields[]=unit&fields[]=status` +
        `&fields[]=source_batch_id&fields[]=source_location_id&fields[]=staging_location_id&limit=200`
      );
      const items: Array<{ id: string; material_id: string; requested_qty: number; unit: string; status: string; source_batch_id: string | null; source_location_id: string | null; staging_location_id: string | null }> =
        (await itemsRes.json())?.data ?? [];

      if (items.length === 0) { setLines([]); return; }

      // Resolve material names + source batch numbers + location codes
      const matIds = [...new Set(items.map(i => i.material_id))];
      const matsRes = await fetch(`/api/items/raw_materials?filter[id][_in]=${matIds.join(',')}&fields[]=id&fields[]=name&limit=200`);
      const matMap: Record<string, string> = {};
      for (const m of (await matsRes.json())?.data ?? []) matMap[m.id] = m.name;

      const batchIds = items.map(i => i.source_batch_id).filter(Boolean) as string[];
      const batchMap: Record<string, string> = {};
      if (batchIds.length > 0) {
        const br = await fetch(`/api/items/batches?filter[id][_in]=${batchIds.join(',')}&fields[]=id&fields[]=batch_number&limit=200`);
        for (const b of (await br.json())?.data ?? []) batchMap[b.id] = b.batch_number;
      }

      const locIds = [
        ...items.map(i => i.source_location_id),
        ...items.map(i => i.staging_location_id),
      ].filter(Boolean) as string[];
      const locMap: Record<string, string> = {};
      if (locIds.length > 0) {
        const lr = await fetch(`/api/items/warehouse_locations?filter[id][_in]=${[...new Set(locIds)].join(',')}&fields[]=id&fields[]=location_code&limit=200`);
        for (const l of (await lr.json())?.data ?? []) locMap[l.id] = l.location_code;
      }

      setLines(items.map(i => ({
        id: i.id,
        material_name: matMap[i.material_id] ?? i.material_id.slice(0, 8),
        requested_qty: i.requested_qty,
        unit: i.unit,
        status: i.status ?? 'pending',
        source_batch_number: i.source_batch_id ? (batchMap[i.source_batch_id] ?? null) : null,
        source_location_code: i.source_location_id ? (locMap[i.source_location_id] ?? null) : null,
        staging_location_code: i.staging_location_id ? (locMap[i.staging_location_id] ?? null) : null,
      })));
    } catch (err) {
      console.error('Failed to load WO detail:', err);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => { load(); }, [load]);

  // Default each pending line to the first staging bin
  useEffect(() => {
    if (stagingLocations.length === 0) return;
    setStagingByLine(prev => {
      const next = { ...prev };
      for (const l of lines) {
        if (l.status === 'pending' && !next[l.id]) {
          next[l.id] = stagingLocations[0].id;
        }
      }
      return next;
    });
  }, [lines, stagingLocations]);

  const stageLine = async (lineId: string) => {
    const stagingId = stagingByLine[lineId];
    if (!stagingId) {
      notifications.show({ title: 'Pick a staging bin', message: 'Select a staging location first.', color: 'orange' });
      return;
    }
    setStagingInFlight(lineId);
    try {
      const res = await fetch('/api/production/stage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mr_item_id: lineId, staging_location_id: stagingId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.errors?.[0]?.message ?? 'Stage failed');
      }
      notifications.show({ title: 'Staged', message: 'Material moved to staging zone.', color: 'green' });
      await load();
    } catch (err) {
      notifications.show({ title: 'Error', message: err instanceof Error ? err.message : 'Failed', color: 'red' });
    } finally {
      setStagingInFlight(null);
    }
  };

  if (loading) {
    return <Group justify="center" py="xl"><Loader /></Group>;
  }
  if (!order) {
    return <Alert color="red">Production order not found.</Alert>;
  }

  const pendingLines = lines.filter(l => l.status === 'pending');
  const allStagedOrLater = lines.length > 0 && lines.every(l => ['staged', 'delivered', 'received'].includes(l.status));
  const stagingChoices = stagingLocations.map(s => ({
    text: `${s.location_code} (${(s.current_occupancy_kg ?? 0).toFixed(0)} / ${s.capacity_kg ?? 0} kg)`,
    value: s.id,
  }));

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
        <Text fw={600} size="sm" mb="sm">Pick List — Stage Materials</Text>
        <Text c="dimmed" size="xs" mb="md">
          Each line shows the FEFO-selected source batch and where to pick from.
          Pick a staging bin and click Stage to physically move the batch into staging.
        </Text>
        {lines.length === 0 ? (
          <Alert color="blue" variant="light">No material request items found for this order.</Alert>
        ) : (
          <Table withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Material</Table.Th>
                <Table.Th>Required</Table.Th>
                <Table.Th>Source Batch</Table.Th>
                <Table.Th>Pick From</Table.Th>
                <Table.Th>Stage To</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Action</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {lines.map(line => {
                const isPending = line.status === 'pending';
                const isUnfulfillable = line.status === 'unfulfillable';
                return (
                  <Table.Tr key={line.id}>
                    <Table.Td><Text size="sm">{line.material_name}</Text></Table.Td>
                    <Table.Td><Text size="sm">{line.requested_qty} {line.unit}</Text></Table.Td>
                    <Table.Td>
                      {line.source_batch_number ? (
                        <Text size="xs" style={{ fontFamily: 'monospace' }}>{line.source_batch_number}</Text>
                      ) : (
                        <Text size="xs" c="dimmed">—</Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      {line.source_location_code ? (
                        <Badge size="sm" color="blue" variant="light">{line.source_location_code}</Badge>
                      ) : (
                        <Text size="xs" c="dimmed">—</Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      {line.staging_location_code ? (
                        <Badge size="sm" color="cyan" variant="light">{line.staging_location_code}</Badge>
                      ) : isPending && !isUnfulfillable && stagingChoices.length > 0 ? (
                        <SelectDropdown
                          choices={stagingChoices}
                          value={stagingByLine[line.id] ?? null}
                          onChange={(v) => setStagingByLine(p => ({ ...p, [line.id]: String(v ?? '') }))}
                        />
                      ) : (
                        <Text size="xs" c="dimmed">—</Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Badge size="sm" color={LINE_STATUS_COLORS[line.status] ?? 'gray'} variant="light">
                        {LINE_STATUS_LABELS[line.status] ?? line.status}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      {isPending && !isUnfulfillable ? (
                        <Button
                          size="xs"
                          color="blue"
                          leftSection={<IconPackage size={12} />}
                          loading={stagingInFlight === line.id}
                          disabled={!stagingByLine[line.id] || stagingLoading}
                          onClick={() => stageLine(line.id)}
                        >
                          Stage
                        </Button>
                      ) : isUnfulfillable ? (
                        <Tooltip label="No source batch — re-release the order after stock arrives.">
                          <Badge size="xs" color="red" variant="light"><IconAlertTriangle size={10} /> Blocked</Badge>
                        </Tooltip>
                      ) : (
                        <Badge size="xs" color="green" variant="light"><IconCheck size={10} /> Done</Badge>
                      )}
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        )}
      </Paper>

      {order.status === 'released' && pendingLines.length > 0 && (
        <Alert color="blue" variant="light">
          {pendingLines.length} material{pendingLines.length !== 1 ? 's' : ''} still need to be staged.
        </Alert>
      )}

      {order.status === 'released' && allStagedOrLater && (
        <Alert color="cyan" variant="light">
          All materials staged. Logistic will confirm delivery to production next.
        </Alert>
      )}

      {order.status === 'in_progress' && (
        <Alert color="violet" variant="light">Production is in progress.</Alert>
      )}
      {order.status === 'completed' && (
        <Alert color="teal" variant="light">Production complete.</Alert>
      )}

      <Group>
        <Button variant="subtle" onClick={() => router.push('/warehouse')}>← Back to Warehouse</Button>
      </Group>
    </Stack>
  );
}
