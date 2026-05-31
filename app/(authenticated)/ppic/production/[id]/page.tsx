'use client';

import { Stack, Title, Text, Group, Badge, Button, Alert, Table, Paper, Loader } from '@mantine/core';
import { CollectionForm } from '@/components/ui/collection-form';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconAlertTriangle } from '@tabler/icons-react';

const STATUS_TRANSITIONS: Record<string, Array<{ value: string; label: string; color: string }>> = {
  draft:   [{ value: 'planned', label: 'Submit for Planning', color: 'blue' }, { value: 'cancelled', label: 'Cancel Order', color: 'red' }],
  planned: [{ value: 'released', label: 'Release for Production', color: 'teal' }, { value: 'cancelled', label: 'Cancel Order', color: 'red' }],
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'gray', planned: 'blue', waiting_issue: 'orange',
  released: 'indigo', in_progress: 'violet', completed: 'dark',
  on_hold: 'orange', cancelled: 'red',
};
const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft', planned: 'Planned', waiting_issue: 'Waiting Issue',
  released: 'Released', in_progress: 'In Progress',
  completed: 'Completed', on_hold: 'On Hold', cancelled: 'Cancelled',
};

interface MaterialCheckRow {
  id: string;
  material_name: string;
  requested_qty: number;
  stock_available: number | null;
  shortage_qty: number | null;
  unit: string;
}

export default function ProductionOrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [status, setStatus] = useState<string | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const [checkRows, setCheckRows] = useState<MaterialCheckRow[]>([]);
  const [loadingCheck, setLoadingCheck] = useState(true);

  useEffect(() => {
    fetch(`/api/items/production_orders/${id}?fields[]=status`)
      .then((r) => r.json())
      .then((d) => setStatus(d?.data?.status ?? null))
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    async function loadMaterialCheck() {
      setLoadingCheck(true);
      try {
        const mrRes = await fetch(`/api/items/material_requests?filter[production_order_id][_eq]=${id}&fields[]=id&limit=10`);
        const mrs: Array<{ id: string }> = (await mrRes.json())?.data ?? [];
        if (mrs.length === 0) { setCheckRows([]); return; }

        const mrIds = mrs.map(m => m.id).join(',');
        const itemsRes = await fetch(
          `/api/items/material_request_items?filter[material_request_id][_in]=${mrIds}` +
          `&fields[]=id&fields[]=material_id&fields[]=requested_qty&fields[]=unit&fields[]=stock_available&fields[]=shortage_qty&limit=200`
        );
        const items: Array<{ id: string; material_id: string; requested_qty: number; unit: string; stock_available: number | null; shortage_qty: number | null }> =
          (await itemsRes.json())?.data ?? [];

        if (items.length === 0) { setCheckRows([]); return; }

        const matIds = [...new Set(items.map(i => i.material_id))].join(',');
        const matsRes = await fetch(`/api/items/raw_materials?filter[id][_in]=${matIds}&fields[]=id&fields[]=name&limit=200`);
        const matMap: Record<string, string> = {};
        for (const m of (await matsRes.json())?.data ?? []) matMap[m.id] = m.name;

        setCheckRows(items.map(i => ({
          id: i.id,
          material_name: matMap[i.material_id] ?? i.material_id.slice(0, 8),
          requested_qty: i.requested_qty,
          stock_available: i.stock_available,
          shortage_qty: i.shortage_qty,
          unit: i.unit,
        })));
      } catch {
        setCheckRows([]);
      } finally {
        setLoadingCheck(false);
      }
    }
    loadMaterialCheck();
  }, [id]);

  const handleTransition = async (newStatus: string) => {
    setTransitioning(true);
    try {
      const res = await fetch(`/api/items/production_orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.errors?.[0]?.message ?? 'Status update failed');
      }
      // Re-read status — Extension B may have overridden it (e.g. planned→released becomes waiting_issue)
      const readRes = await fetch(`/api/items/production_orders/${id}?fields[]=status`);
      const finalStatus = (await readRes.json())?.data?.status ?? newStatus;
      setStatus(finalStatus);
      notifications.show({ title: 'Updated', message: `Production order is now ${STATUS_LABELS[finalStatus] ?? finalStatus}`, color: 'green' });
    } catch (err) {
      notifications.show({ title: 'Error', message: err instanceof Error ? err.message : 'Failed', color: 'red' });
    } finally {
      setTransitioning(false);
    }
  };

  const nextTransitions = status ? (STATUS_TRANSITIONS[status] ?? []) : [];
  const hasCheckData = checkRows.length > 0 && checkRows.some(r => r.stock_available !== null);
  const isReadOnly = status !== null && !['draft', 'planned'].includes(status);

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-start">
        <div>
          <Title order={2}>Production Order Detail</Title>
          <Text c="dimmed" size="sm">Review the production plan and move it through the next step.</Text>
        </div>
        {status && (
          <Badge size="lg" color={STATUS_COLORS[status] ?? 'gray'} variant="light">
            {STATUS_LABELS[status] ?? status}
          </Badge>
        )}
      </Group>

      {nextTransitions.length > 0 && (
        <Group gap="xs">
          <Text size="sm" fw={500} c="dimmed">Actions:</Text>
          {nextTransitions.map((t) => (
            <Button key={t.value} size="xs" color={t.color} variant="light" loading={transitioning} onClick={() => handleTransition(t.value)}>
              {t.label}
            </Button>
          ))}
        </Group>
      )}

      {(status === 'completed' || status === 'cancelled') && (
        <Alert icon={<IconAlertCircle size={16} />} color="gray" variant="light">
          This production order is finished or cancelled and can no longer be changed.
        </Alert>
      )}

      {loadingCheck ? (
        <Group gap="xs"><Loader size="xs" /><Text size="sm" c="dimmed">Loading material check...</Text></Group>
      ) : hasCheckData ? (
        <Paper p="md" radius="md" withBorder>
          <Text fw={600} size="sm" mb="sm">Material Check Result</Text>
          {status === 'waiting_issue' && (
            <Alert icon={<IconAlertTriangle size={14} />} color="orange" variant="light" mb="sm">
              This order is blocked due to insufficient stock. It will be auto-released when materials become available.
            </Alert>
          )}
          <Table withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Material</Table.Th>
                <Table.Th>Requested</Table.Th>
                <Table.Th>Available</Table.Th>
                <Table.Th>Shortage</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {checkRows.map(row => (
                <Table.Tr key={row.id} style={row.shortage_qty && row.shortage_qty > 0 ? { backgroundColor: 'var(--mantine-color-red-0)' } : undefined}>
                  <Table.Td><Text size="sm">{row.material_name}</Text></Table.Td>
                  <Table.Td><Text size="sm">{row.requested_qty} {row.unit}</Text></Table.Td>
                  <Table.Td><Text size="sm" c={row.stock_available === null ? 'dimmed' : undefined}>{row.stock_available ?? '—'} {row.stock_available !== null ? row.unit : ''}</Text></Table.Td>
                  <Table.Td>
                    {row.shortage_qty === null ? <Text size="sm" c="dimmed">—</Text>
                     : row.shortage_qty > 0 ? <Text size="sm" c="red" fw={600}>{row.shortage_qty} {row.unit}</Text>
                     : <Text size="sm" c="green">✓ OK</Text>}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Paper>
      ) : null}

      <CollectionForm
        collection="production_orders"
        mode="edit"
        id={id}
        onSuccess={() => router.push('/ppic/production')}
        onCancel={() => router.push('/ppic/production')}
      />
    </Stack>
  );
}
