'use client';

import { Stack, Title, Text, Group, Badge, Button, Alert, Paper, Loader, Table, Divider } from '@mantine/core';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconCircleCheck, IconPlayerPlay, IconAlertTriangle, IconNote } from '@tabler/icons-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const STATUS_COLORS: Record<string, string> = {
  released: 'indigo', in_progress: 'violet', completed: 'teal',
  waiting_issue: 'orange', on_hold: 'orange', cancelled: 'red',
};
const STATUS_LABELS: Record<string, string> = {
  released: 'Released — Materials Coming', in_progress: 'In Progress', completed: 'Completed',
  waiting_issue: 'Waiting Issue', on_hold: 'On Hold', cancelled: 'Cancelled',
};
const LINE_STATUS_COLORS: Record<string, string> = {
  pending: 'gray', staged: 'cyan', delivered: 'blue', received: 'green', unfulfillable: 'red',
};
const LINE_STATUS_LABELS: Record<string, string> = {
  pending: 'Pick pending', staged: 'Staged', delivered: 'Delivered to floor', received: 'Received', unfulfillable: 'No stock',
};

interface OrderInfo {
  order_number: string;
  status: string;
  product_id: string;
  product_name: string;
  product_unit: string;
  planned_qty: number;
  unit: string;
  actual_output_qty: number | null;
  actual_unit: string | null;
  yield_pct: number | null;
  actual_start_at: string | null;
  actual_end_at: string | null;
  fg_batch_id: string | null;
  completion_notes: string | null;
}

interface MaterialLine {
  id: string;
  material_name: string;
  requested_qty: number;
  unit: string;
  status: string;
  delivered_qty: number | null;
  received_qty: number | null;
  staging_location_code: string | null;
}

interface LogEntry {
  id: string;
  process_notes: string | null;
  equipment_used: string | null;
  any_deviations: string | null;
  date_created: string | null;
}

interface FGBatch {
  id: string;
  batch_number: string;
  status: string;
  qty: number;
  unit: string;
}

export default function ProductionOrderDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const orderId = id as string;

  const [order, setOrder] = useState<OrderInfo | null>(null);
  const [lines, setLines] = useState<MaterialLine[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [fgBatch, setFgBatch] = useState<FGBatch | null>(null);
  const [loading, setLoading] = useState(true);

  // local edit state
  const [receiveEdits, setReceiveEdits] = useState<Record<string, { qty: number; notes: string }>>({});
  const [receiving, setReceiving] = useState(false);

  const [newLog, setNewLog] = useState({ process_notes: '', equipment_used: '', any_deviations: '' });
  const [logging, setLogging] = useState(false);

  const [completeForm, setCompleteForm] = useState({ actual_output_qty: '' as string | number, completion_notes: '' });
  const [completing, setCompleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const orderRes = await fetch(
        `/api/items/production_orders/${orderId}` +
        '?fields[]=order_number&fields[]=status&fields[]=product_id&fields[]=planned_qty&fields[]=unit' +
        '&fields[]=actual_output_qty&fields[]=actual_unit&fields[]=yield_pct&fields[]=actual_start_at&fields[]=actual_end_at' +
        '&fields[]=fg_batch_id&fields[]=completion_notes'
      );
      const od = (await orderRes.json())?.data;
      if (!od) return;

      let productName = od.product_id;
      let productUnit = od.unit;
      if (od.product_id) {
        const pr = await fetch(`/api/items/products/${od.product_id}?fields[]=name&fields[]=unit`).then(r => r.json());
        productName = pr?.data?.name ?? productName;
        productUnit = pr?.data?.unit ?? productUnit;
      }

      setOrder({
        order_number: od.order_number,
        status: od.status,
        product_id: od.product_id,
        product_name: productName,
        product_unit: productUnit,
        planned_qty: od.planned_qty,
        unit: od.unit,
        actual_output_qty: od.actual_output_qty,
        actual_unit: od.actual_unit,
        yield_pct: od.yield_pct,
        actual_start_at: od.actual_start_at,
        actual_end_at: od.actual_end_at,
        fg_batch_id: od.fg_batch_id,
        completion_notes: od.completion_notes,
      });

      // Pre-fill complete form unit
      setCompleteForm(p => ({ ...p, actual_output_qty: p.actual_output_qty || (od.actual_output_qty ?? '') }));

      // Material lines
      const mrRes = await fetch(`/api/items/material_requests?filter[production_order_id][_eq]=${orderId}&fields[]=id&limit=10`);
      const mrs: Array<{ id: string }> = (await mrRes.json())?.data ?? [];
      let mrItems: Array<{ id: string; material_id: string; requested_qty: number; unit: string; status: string; delivered_qty: number | null; received_qty: number | null; staging_location_id: string | null }> = [];
      if (mrs.length > 0) {
        const mrIds = mrs.map(m => m.id).join(',');
        const itemsRes = await fetch(
          `/api/items/material_request_items?filter[material_request_id][_in]=${mrIds}` +
          `&fields[]=id&fields[]=material_id&fields[]=requested_qty&fields[]=unit&fields[]=status` +
          `&fields[]=delivered_qty&fields[]=received_qty&fields[]=staging_location_id&limit=200`
        );
        mrItems = (await itemsRes.json())?.data ?? [];
      }

      const matIds = [...new Set(mrItems.map(i => i.material_id))];
      const matMap: Record<string, string> = {};
      if (matIds.length > 0) {
        const mr2 = await fetch(`/api/items/raw_materials?filter[id][_in]=${matIds.join(',')}&fields[]=id&fields[]=name&limit=200`);
        for (const m of (await mr2.json())?.data ?? []) matMap[m.id] = m.name;
      }

      const locIds = mrItems.map(i => i.staging_location_id).filter(Boolean) as string[];
      const locMap: Record<string, string> = {};
      if (locIds.length > 0) {
        const lr = await fetch(`/api/items/warehouse_locations?filter[id][_in]=${[...new Set(locIds)].join(',')}&fields[]=id&fields[]=location_code&limit=200`);
        for (const l of (await lr.json())?.data ?? []) locMap[l.id] = l.location_code;
      }

      const newLines = mrItems.map(i => ({
        id: i.id,
        material_name: matMap[i.material_id] ?? i.material_id.slice(0, 8),
        requested_qty: i.requested_qty,
        unit: i.unit,
        status: i.status ?? 'pending',
        delivered_qty: i.delivered_qty,
        received_qty: i.received_qty,
        staging_location_code: i.staging_location_id ? (locMap[i.staging_location_id] ?? null) : null,
      }));
      setLines(newLines);

      // Pre-fill receive edits with delivered_qty for delivered rows
      setReceiveEdits(prev => {
        const next = { ...prev };
        for (const l of newLines) {
          if (l.status === 'delivered' && !next[l.id]) {
            next[l.id] = { qty: l.delivered_qty ?? l.requested_qty, notes: '' };
          }
        }
        return next;
      });

      // Production logs
      const logRes = await fetch(
        `/api/items/production_logs?filter[production_order_id][_eq]=${orderId}` +
        `&fields[]=id&fields[]=process_notes&fields[]=equipment_used&fields[]=any_deviations&fields[]=date_created` +
        `&sort[]=-date_created&limit=50`
      );
      setLogs((await logRes.json())?.data ?? []);

      // FG batch (if completed)
      if (od.fg_batch_id) {
        const fgRes = await fetch(`/api/items/batches/${od.fg_batch_id}?fields[]=id&fields[]=batch_number&fields[]=status&fields[]=qty&fields[]=unit`);
        setFgBatch((await fgRes.json())?.data ?? null);
      } else {
        setFgBatch(null);
      }
    } catch (err) {
      console.error('Failed to load production order:', err);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => { load(); }, [load]);

  const deliveredLines = lines.filter(l => l.status === 'delivered');
  const allReceived = lines.length > 0 && lines.every(l => l.status === 'received');

  const confirmReceipt = async () => {
    if (deliveredLines.length === 0) return;
    setReceiving(true);
    try {
      const otherLinesAlreadyReceived = lines.filter(l => l.status === 'received').length;
      const willStartOrder = otherLinesAlreadyReceived + deliveredLines.length === lines.length;
      const body = {
        lines: deliveredLines.map(l => ({
          mr_item_id: l.id,
          received_qty: receiveEdits[l.id]?.qty ?? l.delivered_qty ?? l.requested_qty,
          discrepancy_notes: receiveEdits[l.id]?.notes || undefined,
        })),
        ...(willStartOrder ? { start_order: { production_order_id: orderId } } : {}),
      };
      const res = await fetch('/api/production/receive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      const failures = (data?.results ?? []).filter((r: { ok: boolean }) => !r.ok);
      if (failures.length > 0) {
        notifications.show({ title: 'Partial failure', message: `${failures.length} line(s) failed.`, color: 'orange' });
      } else if (willStartOrder) {
        notifications.show({ title: 'Production started', message: 'All materials received. Order is now in progress.', color: 'green' });
      } else {
        notifications.show({ title: 'Received', message: `${deliveredLines.length} line(s) confirmed.`, color: 'green' });
      }
      await load();
    } catch (err) {
      notifications.show({ title: 'Error', message: err instanceof Error ? err.message : 'Failed', color: 'red' });
    } finally {
      setReceiving(false);
    }
  };

  const addLog = async () => {
    if (!newLog.process_notes && !newLog.equipment_used && !newLog.any_deviations) {
      notifications.show({ title: 'Empty log', message: 'Add at least one field before saving.', color: 'orange' });
      return;
    }
    setLogging(true);
    try {
      const res = await fetch('/api/items/production_logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          production_order_id: orderId,
          process_notes: newLog.process_notes || null,
          equipment_used: newLog.equipment_used || null,
          any_deviations: newLog.any_deviations || null,
        }),
      });
      if (!res.ok) throw new Error((await res.json())?.errors?.[0]?.message ?? 'Failed');
      setNewLog({ process_notes: '', equipment_used: '', any_deviations: '' });
      notifications.show({ title: 'Log added', message: 'Production log entry recorded.', color: 'green' });
      await load();
    } catch (err) {
      notifications.show({ title: 'Error', message: err instanceof Error ? err.message : 'Failed', color: 'red' });
    } finally {
      setLogging(false);
    }
  };

  const completeOrder = async () => {
    const qty = typeof completeForm.actual_output_qty === 'number' ? completeForm.actual_output_qty : parseFloat(String(completeForm.actual_output_qty));
    if (!qty || isNaN(qty) || qty <= 0) {
      notifications.show({ title: 'Invalid output', message: 'Actual output qty must be a positive number.', color: 'orange' });
      return;
    }
    setCompleting(true);
    try {
      const res = await fetch('/api/production/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          production_order_id: orderId,
          actual_output_qty: qty,
          actual_unit: order?.product_unit ?? order?.unit ?? null,
          completion_notes: completeForm.completion_notes || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.errors?.[0]?.message ?? 'Complete failed');
      }
      notifications.show({ title: 'Order completed', message: 'A finished goods batch was created and sent to QC.', color: 'green' });
      await load();
    } catch (err) {
      notifications.show({ title: 'Error', message: err instanceof Error ? err.message : 'Failed', color: 'red' });
    } finally {
      setCompleting(false);
    }
  };

  if (loading) return <Group justify="center" py="xl"><Loader /></Group>;
  if (!order) return <Alert color="red">Production order not found.</Alert>;

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-start">
        <div>
          <Title order={2}>{order.order_number}</Title>
          <Text c="dimmed" size="sm">{order.product_name} | Planned: {order.planned_qty} {order.unit}</Text>
        </div>
        <Badge size="lg" color={STATUS_COLORS[order.status] ?? 'gray'} variant="light">
          {STATUS_LABELS[order.status] ?? order.status}
        </Badge>
      </Group>

      {/* ── Materials section ───────────────────────────────────────────────── */}
      <Paper p="md" radius="md" withBorder>
        <Text fw={600} size="sm" mb="sm">Materials Status</Text>
        {lines.length === 0 ? (
          <Alert color="blue" variant="light">No material request items found.</Alert>
        ) : (
          <Table withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Material</Table.Th>
                <Table.Th>Requested</Table.Th>
                <Table.Th>Staging</Table.Th>
                <Table.Th>Status</Table.Th>
                {order.status === 'released' && <Table.Th>Confirm Receipt</Table.Th>}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {lines.map(line => {
                const isDelivered = line.status === 'delivered';
                const edit = receiveEdits[line.id] ?? { qty: line.delivered_qty ?? line.requested_qty, notes: '' };
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
                      <Badge size="sm" color={LINE_STATUS_COLORS[line.status] ?? 'gray'} variant="light">
                        {LINE_STATUS_LABELS[line.status] ?? line.status}
                      </Badge>
                      {line.status === 'received' && line.received_qty != null && (
                        <Text size="xs" c="dimmed" mt={2}>Received: {line.received_qty} {line.unit}</Text>
                      )}
                    </Table.Td>
                    {order.status === 'released' && (
                      <Table.Td>
                        {isDelivered ? (
                          <Stack gap={4}>
                            <Input
                              type="float"
                              value={edit.qty}
                              onChange={(v) => setReceiveEdits(p => ({ ...p, [line.id]: { ...edit, qty: typeof v === 'number' ? v : parseFloat(String(v ?? '')) || 0 } }))}
                            />
                            <Textarea
                              value={edit.notes}
                              onChange={(v) => setReceiveEdits(p => ({ ...p, [line.id]: { ...edit, notes: String(v ?? '') } }))}
                              placeholder="Discrepancy notes (optional)"
                            />
                          </Stack>
                        ) : line.status === 'received' ? (
                          <Badge size="xs" color="green" variant="light"><IconCheck size={10} /> Received</Badge>
                        ) : (
                          <Text size="xs" c="dimmed">Awaiting delivery</Text>
                        )}
                      </Table.Td>
                    )}
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        )}

        {order.status === 'released' && deliveredLines.length > 0 && (
          <Group mt="md">
            <Button
              color="violet"
              leftSection={<IconPlayerPlay size={16} />}
              loading={receiving}
              onClick={confirmReceipt}
            >
              Confirm Receipt for {deliveredLines.length} line{deliveredLines.length !== 1 ? 's' : ''}
              {(lines.filter(l => l.status === 'received').length + deliveredLines.length === lines.length) && ' & Start Production'}
            </Button>
          </Group>
        )}

        {order.status === 'released' && allReceived && (
          <Alert color="green" variant="light" mt="md">
            All materials received. Click Confirm Receipt to start production.
          </Alert>
        )}
      </Paper>

      {/* ── Production Log (in_progress only) ───────────────────────────────── */}
      {(order.status === 'in_progress' || logs.length > 0) && (
        <Paper p="md" radius="md" withBorder>
          <Text fw={600} size="sm" mb="sm">Production Log</Text>
          {order.actual_start_at && (
            <Text size="xs" c="dimmed" mb="md">Started: {new Date(order.actual_start_at).toLocaleString()}</Text>
          )}

          {order.status === 'in_progress' && (
            <Paper p="sm" withBorder mb="md" style={{ backgroundColor: '#f8f9fa' }}>
              <Stack gap="xs">
                <Text size="xs" fw={600}>Add log entry</Text>
                <Group grow align="flex-start">
                  <Input
                    label="Equipment used"
                    placeholder="Mixer A, Line 2..."
                    value={newLog.equipment_used}
                    onChange={(v) => setNewLog(p => ({ ...p, equipment_used: String(v ?? '') }))}
                  />
                </Group>
                <Textarea
                  label="Process notes"
                  placeholder="Batch conditions, temperature, observations..."
                  value={newLog.process_notes}
                  onChange={(v) => setNewLog(p => ({ ...p, process_notes: String(v ?? '') }))}
                />
                <Textarea
                  label="Deviations"
                  placeholder="Any deviation from BOM or process standard"
                  value={newLog.any_deviations}
                  onChange={(v) => setNewLog(p => ({ ...p, any_deviations: String(v ?? '') }))}
                />
                <Group>
                  <Button leftSection={<IconNote size={14} />} loading={logging} onClick={addLog}>
                    Save Log Entry
                  </Button>
                </Group>
              </Stack>
            </Paper>
          )}

          {logs.length === 0 ? (
            <Text size="sm" c="dimmed">No log entries yet.</Text>
          ) : (
            <Stack gap="xs">
              {logs.map(log => (
                <Paper key={log.id} p="sm" withBorder>
                  <Group justify="space-between" mb={4}>
                    <Text size="xs" c="dimmed">{log.date_created ? new Date(log.date_created).toLocaleString() : ''}</Text>
                    {log.equipment_used && <Badge size="xs" variant="light">{log.equipment_used}</Badge>}
                  </Group>
                  {log.process_notes && <Text size="sm">{log.process_notes}</Text>}
                  {log.any_deviations && (
                    <Group gap={4} mt={4}>
                      <IconAlertTriangle size={12} color="orange" />
                      <Text size="xs" c="orange">{log.any_deviations}</Text>
                    </Group>
                  )}
                </Paper>
              ))}
            </Stack>
          )}
        </Paper>
      )}

      {/* ── Complete Production (in_progress only) ──────────────────────────── */}
      {order.status === 'in_progress' && (
        <Paper p="md" radius="md" withBorder style={{ borderColor: 'var(--mantine-color-teal-4)' }}>
          <Text fw={600} size="sm" mb="sm">Complete Production</Text>
          <Text c="dimmed" size="xs" mb="md">
            Record actual output. A finished goods batch will be created automatically and sent to QC.
          </Text>
          <Stack gap="sm">
            <Group grow align="flex-start">
              <Input
                label={`Actual Output (${order.product_unit})`}
                placeholder={`Planned: ${order.planned_qty} ${order.unit}`}
                type="float"
                value={completeForm.actual_output_qty || null}
                onChange={(v) => setCompleteForm(p => ({ ...p, actual_output_qty: v ?? '' }))}
                required
              />
            </Group>
            <Textarea
              label="Completion Notes"
              placeholder="Optional summary of the run"
              value={completeForm.completion_notes}
              onChange={(v) => setCompleteForm(p => ({ ...p, completion_notes: String(v ?? '') }))}
            />
            <Group>
              <Button color="teal" leftSection={<IconCheck size={16} />} loading={completing} onClick={completeOrder}>
                Complete & Create FG Batch
              </Button>
            </Group>
          </Stack>
        </Paper>
      )}

      {/* ── Completed view ─────────────────────────────────────────────────── */}
      {order.status === 'completed' && (
        <Paper p="md" radius="md" withBorder style={{ borderColor: 'var(--mantine-color-teal-4)' }}>
          <Group justify="space-between" align="flex-start">
            <div>
              <Text fw={600} size="sm">Production Complete</Text>
              {order.actual_start_at && order.actual_end_at && (
                <Text size="xs" c="dimmed">
                  Run: {new Date(order.actual_start_at).toLocaleString()} → {new Date(order.actual_end_at).toLocaleString()}
                </Text>
              )}
            </div>
            <Group gap="md">
              <div>
                <Text size="xs" c="dimmed">Output</Text>
                <Text fw={600}>{order.actual_output_qty ?? '—'} {order.actual_unit ?? order.unit}</Text>
              </div>
              <div>
                <Text size="xs" c="dimmed">Yield</Text>
                <Text fw={600} c={order.yield_pct != null && order.yield_pct >= 90 ? 'teal' : 'orange'}>
                  {order.yield_pct != null ? `${order.yield_pct.toFixed(1)}%` : '—'}
                </Text>
              </div>
            </Group>
          </Group>

          {order.completion_notes && (
            <>
              <Divider my="sm" />
              <Text size="xs" c="dimmed">Notes:</Text>
              <Text size="sm">{order.completion_notes}</Text>
            </>
          )}

          {fgBatch && (
            <>
              <Divider my="sm" label="Finished Goods Batch" labelPosition="left" />
              <Group>
                <Badge size="md" color="grape" variant="light">{fgBatch.batch_number}</Badge>
                <Text size="sm">{fgBatch.qty} {fgBatch.unit}</Text>
                <Badge size="sm" variant="light">{fgBatch.status}</Badge>
                <Button
                  size="xs"
                  variant="light"
                  leftSection={<IconCircleCheck size={12} />}
                  onClick={() => router.push(`/qc/inspect/${fgBatch.id}`)}
                >
                  View in QC
                </Button>
              </Group>
            </>
          )}
        </Paper>
      )}

      <Group>
        <Button variant="subtle" onClick={() => router.push('/production/orders')}>← Back to Orders</Button>
      </Group>
    </Stack>
  );
}
