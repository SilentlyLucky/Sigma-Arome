'use client';

import { Stack, Title, Text, Alert, Paper, Group, Button, Badge, Grid, Divider, Progress, ScrollArea } from '@mantine/core';
import { CollectionList } from '@/components/ui/collection-list';
import { IconInfoCircle, IconAlertTriangle } from '@tabler/icons-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useMemo, Suspense } from 'react';
import { notifications } from '@mantine/notifications';
import { Input } from '@/components/ui/input';
import { SelectDropdown } from '@/components/ui/select-dropdown';
import { DateTime } from '@/components/ui/datetime';
import { Textarea } from '@/components/ui/textarea';

interface Order {
  id: string;
  order_number: string;
  material_id: string;
  ordered_qty: number;
  unit: string;
  supplier_id: string | null;
}
interface Material { id: string; name: string; code: string }
interface ReceiptSummary { total_received: number; receipt_count: number }

function ReceiveForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedOrderId = searchParams.get('order_id') ?? '';

  const [orders, setOrders] = useState<Order[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [receiptSummaries, setReceiptSummaries] = useState<Record<string, ReceiptSummary>>({});
  const [historyKey, setHistoryKey] = useState(0);

  const materialNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of materials) map.set(m.id, m.name);
    return map;
  }, [materials]);

  const [form, setForm] = useState({
    order_id: preselectedOrderId,
    material_id: '',
    received_qty: '' as string | number,
    unit: '',
    supplier_lot: '',
    expiry_date: null as string | null,
    packaging_condition: 'good',
    delivery_note_ref: '',
    coa_reference: '',
    notes: '',
  });

  useEffect(() => {
    Promise.all([
      fetch('/api/items/raw_material_orders?filter[status][_in]=ordered,partially_received&fields[]=id&fields[]=order_number&fields[]=material_id&fields[]=ordered_qty&fields[]=unit&fields[]=supplier_id&limit=100')
        .then(r => r.json()).then(d => d?.data ?? []),
      fetch('/api/items/raw_materials?filter[status][_eq]=active&fields[]=id&fields[]=name&fields[]=code&limit=100')
        .then(r => r.json()).then(d => d?.data ?? []),
    ]).then(([ordersData, matsData]) => {
      setOrders(ordersData);
      setMaterials(matsData);

      // Pre-select order from URL param
      if (preselectedOrderId) {
        const order = ordersData.find((o: Order) => o.id === preselectedOrderId);
        if (order) {
          setForm(f => ({
            ...f,
            order_id: preselectedOrderId,
            material_id: order.material_id,
            unit: order.unit,
          }));
          // Fetch receipt summary for the pre-selected order
          fetch(`/api/items/raw_material_receipts?filter[order_id][_eq]=${preselectedOrderId}&fields[]=received_qty&limit=200`)
            .then(r => r.json())
            .then(d => {
              const receipts: { received_qty: number }[] = d?.data ?? [];
              const total = receipts.reduce((sum, r) => sum + (r.received_qty || 0), 0);
              setReceiptSummaries(prev => ({
                ...prev,
                [preselectedOrderId]: { total_received: total, receipt_count: receipts.length },
              }));
            }).catch(() => {});
        }
      }
    }).finally(() => setLoadingData(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOrderChange = (v: string | number | boolean | null) => {
    const orderId = String(v ?? '');
    const order = orders.find(o => o.id === orderId);
    setForm(f => ({
      ...f,
      order_id: orderId,
      material_id: order?.material_id ?? '',
      unit: order?.unit ?? '',
      received_qty: '',
    }));

    if (orderId) {
      fetch(`/api/items/raw_material_receipts?filter[order_id][_eq]=${orderId}&fields[]=received_qty&limit=200`)
        .then(r => r.json())
        .then(d => {
          const receipts: { received_qty: number }[] = d?.data ?? [];
          const total = receipts.reduce((sum, r) => sum + (r.received_qty || 0), 0);
          setReceiptSummaries(prev => ({
            ...prev,
            [orderId]: { total_received: total, receipt_count: receipts.length },
          }));
        }).catch(() => {});
    }
  };

  const selectedOrder = orders.find(o => o.id === form.order_id);
  const isUnplanned = !form.order_id;
  const summary = form.order_id ? receiptSummaries[form.order_id] : null;
  const totalAlreadyReceived = summary?.total_received ?? 0;
  const remainingQty = selectedOrder ? selectedOrder.ordered_qty - totalAlreadyReceived : null;
  const receiptCount = summary?.receipt_count ?? 0;

  const orderChoices = orders.map(o => {
    const mat = materials.find(m => m.id === o.material_id);
    return { text: `${o.order_number} — ${mat?.name ?? 'Unknown'} (${o.ordered_qty} ${o.unit})`, value: o.id };
  });
  const materialChoices = materials.map(m => ({ text: `${m.name} (${m.code})`, value: m.id }));

  const handleSave = async () => {
    const qty = typeof form.received_qty === 'number' ? form.received_qty : parseFloat(String(form.received_qty));

    if (!qty || isNaN(qty) || qty <= 0) {
      notifications.show({ title: 'Missing quantity', message: 'Enter the received quantity before saving.', color: 'red' });
      return;
    }
    if (!form.material_id && !form.order_id) {
      notifications.show({ title: 'Missing material', message: 'Select a PPIC order or choose a material for an unplanned delivery.', color: 'red' });
      return;
    }
    if ((form.packaging_condition === 'acceptable' || form.packaging_condition === 'damaged') && !form.notes.trim()) {
      notifications.show({
        title: 'Notes required',
        message: `Packaging condition "${form.packaging_condition}" requires notes explaining the condition.`,
        color: 'orange',
      });
      return;
    }
    if (selectedOrder && remainingQty !== null && qty > remainingQty) {
      notifications.show({
        title: 'Quantity exceeds remaining',
        message: `Only ${remainingQty} ${selectedOrder.unit} remain on ${selectedOrder.order_number}.`,
        color: 'red',
        autoClose: 8000,
      });
      return;
    }

    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        received_qty: qty,
        unit: form.unit || selectedOrder?.unit,
        packaging_condition: form.packaging_condition,
      };
      if (form.order_id) body.order_id = form.order_id;
      if (form.material_id) body.material_id = form.material_id;
      if (form.supplier_lot) body.supplier_lot = form.supplier_lot;
      if (form.expiry_date) body.expiry_date = form.expiry_date;
      if (form.delivery_note_ref) body.delivery_note_ref = form.delivery_note_ref;
      if (form.coa_reference) body.coa_reference = form.coa_reference;
      if (form.notes) body.notes = form.notes;

      const res = await fetch('/api/items/raw_material_receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        const msg = err?.errors?.[0]?.message ?? err?.error ?? 'Save failed.';
        notifications.show({ title: 'Could not save receipt', message: msg, color: 'red', autoClose: 10000 });
        return;
      }

      const newQty = totalAlreadyReceived + qty;
      const isFullyReceived = selectedOrder && newQty >= selectedOrder.ordered_qty;

      notifications.show({
        title: 'Material received',
        message: isFullyReceived
          ? `Order ${selectedOrder?.order_number} is now fully received.`
          : selectedOrder
          ? `Receipt saved. ${newQty} / ${selectedOrder.ordered_qty} ${selectedOrder.unit} received.`
          : 'Receipt saved. Batch created with QC Pending status.',
        color: 'green',
        autoClose: 6000,
      });

      setForm({ order_id: '', material_id: '', received_qty: '', unit: '', supplier_lot: '', expiry_date: null, packaging_condition: 'good', delivery_note_ref: '', coa_reference: '', notes: '' });
      setReceiptSummaries({});
      setHistoryKey(k => k + 1);

      if (isFullyReceived) router.push('/warehouse/incoming');
    } catch (err) {
      notifications.show({ title: 'Unexpected error', message: err instanceof Error ? err.message : 'An unexpected error occurred.', color: 'red', autoClose: 8000 });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Grid gutter="md">
      {/* ── Left: Receive Form ── */}
      <Grid.Col span={{ base: 12, md: 7 }}>
        <Paper p="md" radius="md" withBorder>
          <Stack gap="sm">
            {loadingData ? (
              <Input label="PPIC Order" placeholder="Loading orders..." disabled onChange={() => {}} />
            ) : orderChoices.length > 0 ? (
              <SelectDropdown
                label="PPIC Order (optional)"
                placeholder="Select an order for a planned delivery, or leave blank for unplanned"
                choices={orderChoices}
                value={form.order_id || null}
                onChange={handleOrderChange}
                allowNone
              />
            ) : (
              <Input label="PPIC Order (optional)" value="" placeholder="No open PPIC orders" disabled onChange={() => {}} />
            )}

            {isUnplanned && (
              <Alert icon={<IconAlertTriangle size={16} />} color="yellow" variant="light">
                <strong>Unplanned delivery</strong> — no PPIC order selected. This receipt will be flagged for review.
              </Alert>
            )}

            {selectedOrder && (
              <Paper p="sm" radius="sm" withBorder>
                <Stack gap={6}>
                  <Group justify="space-between">
                    <Text size="sm" fw={600}>{selectedOrder.order_number}</Text>
                    <Badge variant="light" color="blue">
                      {materials.find(m => m.id === selectedOrder.material_id)?.name ?? 'Unknown'}
                    </Badge>
                  </Group>
                  <Group gap="xl">
                    <Text size="sm">Ordered: <strong>{selectedOrder.ordered_qty} {selectedOrder.unit}</strong></Text>
                    <Text size="sm">Received: <strong>{totalAlreadyReceived} {selectedOrder.unit}</strong>
                      {receiptCount > 0 && <Text component="span" size="xs" c="dimmed"> ({receiptCount}×)</Text>}
                    </Text>
                    <Text size="sm" c={remainingQty === 0 ? 'red' : 'green'}>
                      Remaining: <strong>{remainingQty} {selectedOrder.unit}</strong>
                    </Text>
                  </Group>
                  {remainingQty !== null && selectedOrder.ordered_qty > 0 && (
                    <Progress value={(totalAlreadyReceived / selectedOrder.ordered_qty) * 100} color={remainingQty === 0 ? 'green' : 'blue'} size="sm" />
                  )}
                  {remainingQty === 0 && (
                    <Alert color="green" variant="light" p="xs">This order is fully received.</Alert>
                  )}
                </Stack>
              </Paper>
            )}

            <Group grow align="flex-start">
              {form.order_id ? (
                <Input label="Material (from order)" value={materials.find(m => m.id === form.material_id)?.name ?? '(loading...)'} disabled onChange={() => {}} />
              ) : loadingData ? (
                <Input label="Material" placeholder="Loading..." disabled onChange={() => {}} />
              ) : materialChoices.length > 0 ? (
                <SelectDropdown label="Material" placeholder="Select material" choices={materialChoices} value={form.material_id || null} onChange={(v) => setForm(f => ({ ...f, material_id: String(v ?? '') }))} required />
              ) : (
                <Input label="Material" value="" placeholder="No materials available" disabled onChange={() => {}} />
              )}

              <Input
                label="Received Quantity"
                placeholder={remainingQty !== null ? `Max: ${remainingQty} ${selectedOrder?.unit}` : 'e.g. 50'}
                type="float"
                value={form.received_qty || null}
                onChange={(v) => setForm(f => ({ ...f, received_qty: v ?? '' }))}
                required
                min={0.001}
                step={0.001}
              />
            </Group>

            <Group grow align="flex-start">
              {form.order_id ? (
                <Input label="Unit (locked to order)" value={form.unit} disabled onChange={() => {}} />
              ) : (
                <SelectDropdown
                  label="Unit"
                  choices={[
                    { text: 'kg', value: 'kg' },
                    { text: 'liter', value: 'liter' },
                    { text: 'pcs', value: 'pcs' },
                    { text: 'drum', value: 'drum' },
                    { text: 'bottle', value: 'bottle' },
                  ]}
                  value={form.unit || null}
                  onChange={(v) => setForm(f => ({ ...f, unit: String(v ?? '') }))}
                  required
                />
              )}

              <SelectDropdown
                label="Packaging Condition"
                choices={[
                  { text: 'Good', value: 'good' },
                  { text: 'Acceptable (notes required)', value: 'acceptable' },
                  { text: 'Damaged — QC Hold', value: 'damaged' },
                ]}
                value={form.packaging_condition}
                onChange={(v) => setForm(f => ({ ...f, packaging_condition: String(v ?? 'good') }))}
                required
              />
            </Group>

            <Group grow align="flex-start">
              <Input label="Supplier Lot" placeholder="Supplier batch/lot number" value={form.supplier_lot} onChange={(v) => setForm(f => ({ ...f, supplier_lot: String(v ?? '') }))} />
              <DateTime label="Expiry Date" value={form.expiry_date} onChange={(v) => setForm(f => ({ ...f, expiry_date: v }))} />
            </Group>

            <Group grow align="flex-start">
              <Input label="Delivery Note Ref" placeholder="DN number" value={form.delivery_note_ref} onChange={(v) => setForm(f => ({ ...f, delivery_note_ref: String(v ?? '') }))} />
              <Input label="COA Reference" placeholder="Certificate of Analysis ref" value={form.coa_reference} onChange={(v) => setForm(f => ({ ...f, coa_reference: String(v ?? '') }))} />
            </Group>

            <Textarea
              label={form.packaging_condition !== 'good' ? 'Notes (required for this condition)' : 'Notes'}
              placeholder={form.packaging_condition !== 'good' ? 'Required — describe the packaging condition' : 'Optional notes'}
              value={form.notes}
              onChange={(v) => setForm(f => ({ ...f, notes: String(v ?? '') }))}
            />

            {form.packaging_condition === 'damaged' && (
              <Alert icon={<IconAlertTriangle size={16} />} color="red" variant="light">
                Damaged packaging — batch will be created with <strong>Hold</strong> status for QC review.
              </Alert>
            )}

            <Group justify="flex-end">
              <Button variant="subtle" onClick={() => router.push('/warehouse/incoming')}>← Back to Expected</Button>
              <Button onClick={handleSave} loading={saving} disabled={remainingQty === 0} color="teal">
                {remainingQty === 0 ? 'Order fully received' : 'Receive Material'}
              </Button>
            </Group>
          </Stack>
        </Paper>
      </Grid.Col>

      {/* ── Right: Receiving History Sidebar ── */}
      <Grid.Col span={{ base: 12, md: 5 }}>
        <Paper p="md" radius="md" withBorder h="100%">
          <Text fw={600} size="sm" mb="sm">Recent Receiving History</Text>
          <Divider mb="sm" />
          <ScrollArea h={600}>
            <CollectionList
              key={historyKey}
              collection="raw_material_receipts"
              enableSearch
              enableSort
              enableHeaderMenu
              enableResize
              fields={['receipt_number', 'material_id', 'received_qty', 'unit', 'packaging_condition', 'date_created']}
              onItemClick={(item) => router.push(`/warehouse/receive/${item.id}`)}
              renderCell={(item, header) => {
                if (header.value === 'material_id') {
                  const name = materialNameMap.get(String(item.material_id ?? ''));
                  return name ? <span style={{ fontSize: 'var(--mantine-font-size-sm)' }}>{name}</span> : null;
                }
                return null;
              }}
            />
          </ScrollArea>
        </Paper>
      </Grid.Col>
    </Grid>
  );
}

export default function ReceiveMaterialPage() {
  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Receive Raw Materials</Title>
        <Text c="dimmed" size="sm">
          Record raw materials as they arrive. Select a PPIC order for planned deliveries, or leave it blank for an unplanned delivery.
        </Text>
      </div>
      <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
        Fields marked with <strong>*</strong> are required. Select a PPIC order to auto-fill the material and unit.
      </Alert>
      <Suspense fallback={null}>
        <ReceiveForm />
      </Suspense>
    </Stack>
  );
}
