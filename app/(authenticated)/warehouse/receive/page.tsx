'use client';

import { Stack, Title, Text, Alert, Paper, Group, Button, Badge, Tabs } from '@mantine/core';
import { CollectionList } from '@/components/ui/collection-list';
import { IconInfoCircle, IconAlertTriangle } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import { Input } from '@/components/ui/input';
import { SelectDropdown } from '@/components/ui/select-dropdown';
import { DateTime } from '@/components/ui/datetime';
import { Textarea } from '@/components/ui/textarea';

interface Order { id: string; order_number: string; material_id: string; ordered_qty: number; unit: string; supplier_id: string | null }
interface Material { id: string; name: string; code: string }

export default function ReceiveMaterialPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const [form, setForm] = useState({
    order_id: '',
    material_id: '',
    received_qty: '',
    unit: 'kg',
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
        .then(r => r.json()).then(d => setOrders(d?.data ?? [])),
      fetch('/api/items/raw_materials?filter[status][_eq]=active&fields[]=id&fields[]=name&fields[]=code&limit=100')
        .then(r => r.json()).then(d => setMaterials(d?.data ?? [])),
    ]).finally(() => setLoadingData(false));
  }, []);

  // When order is selected, auto-fill material
  const selectedOrder = orders.find(o => o.id === form.order_id);
  const isUnplanned = !form.order_id;

  const handleOrderChange = (v: string | number | boolean | null) => {
    const orderId = String(v ?? '');
    const order = orders.find(o => o.id === orderId);
    setForm(f => ({
      ...f,
      order_id: orderId,
      material_id: order?.material_id ?? '',
      unit: order?.unit ?? f.unit,
    }));
  };

  const orderChoices = orders.map(o => {
    const mat = materials.find(m => m.id === o.material_id);
    return { text: `${o.order_number} — ${mat?.name ?? 'Unknown'} (${o.ordered_qty} ${o.unit})`, value: o.id };
  });

  const materialChoices = materials.map(m => ({ text: `${m.name} (${m.code})`, value: m.id }));

  const handleSave = async () => {
    if (!form.received_qty || parseFloat(form.received_qty) <= 0) {
      notifications.show({ title: 'Validation', message: 'Received quantity is required', color: 'red' });
      return;
    }
    if (!form.material_id && !form.order_id) {
      notifications.show({ title: 'Validation', message: 'Select a PPIC order or material', color: 'red' });
      return;
    }
    if ((form.packaging_condition === 'acceptable' || form.packaging_condition === 'damaged') && !form.notes.trim()) {
      notifications.show({ title: 'Validation', message: `Packaging "${form.packaging_condition}" requires notes`, color: 'orange' });
      return;
    }

    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        received_qty: parseFloat(form.received_qty),
        unit: form.unit,
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
        throw new Error(err?.errors?.[0]?.message ?? 'Save failed');
      }
      notifications.show({ title: 'Received', message: 'Material received. Batch created with QC Pending status.', color: 'green' });
      // Reset form
      setForm({ order_id: '', material_id: '', received_qty: '', unit: 'kg', supplier_lot: '', expiry_date: null, packaging_condition: 'good', delivery_note_ref: '', coa_reference: '', notes: '' });
    } catch (err) {
      notifications.show({ title: 'Error', message: err instanceof Error ? err.message : 'Failed', color: 'red' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Raw Material Receiving</Title>
        <Text c="dimmed" size="sm">Record incoming raw materials. Select a PPIC order for planned receiving, or leave blank for unplanned.</Text>
      </div>

      <Tabs defaultValue="receive">
        <Tabs.List>
          <Tabs.Tab value="receive">New Receipt</Tabs.Tab>
          <Tabs.Tab value="history">Receipt History</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="receive" pt="md">
          <Paper p="md" radius="md" withBorder>
            <Stack gap="sm">
              {/* PPIC Order Selection */}
              {loadingData ? (
                <Input label="PPIC Order" placeholder="Loading orders..." disabled onChange={() => {}} />
              ) : orderChoices.length > 0 ? (
                <SelectDropdown
                  label="PPIC Order (optional)"
                  placeholder="Select order for planned receiving, or leave blank for unplanned"
                  choices={orderChoices}
                  value={form.order_id || null}
                  onChange={handleOrderChange}
                  allowNone
                />
              ) : (
                <Input
                  label="PPIC Order (optional)"
                  value=""
                  placeholder="No open PPIC orders available — this will be unplanned receiving"
                  disabled
                  onChange={() => {}}
                />
              )}

              {isUnplanned && form.order_id === '' && (
                <Alert icon={<IconAlertTriangle size={16} />} color="yellow" variant="light">
                  <strong>Unplanned Receiving</strong> — no PPIC order selected. This receipt will be flagged as unplanned.
                </Alert>
              )}

              {selectedOrder && (
                <Paper p="xs" radius="sm" withBorder bg="var(--mantine-color-blue-light)">
                  <Group gap="md">
                    <Text size="sm"><strong>Ordered:</strong> {selectedOrder.ordered_qty} {selectedOrder.unit}</Text>
                    <Text size="sm"><strong>Material:</strong> {materials.find(m => m.id === selectedOrder.material_id)?.name ?? 'Unknown'}</Text>
                  </Group>
                </Paper>
              )}

              {/* Material — auto-filled from order, or manual for unplanned */}
              <Group grow align="flex-start">
                {form.order_id ? (
                  <Input
                    label="Material"
                    value={materials.find(m => m.id === form.material_id)?.name ?? '(from order)'}
                    disabled
                    onChange={() => {}}
                  />
                ) : (
                  loadingData ? (
                    <Input label="Material" placeholder="Loading..." disabled onChange={() => {}} />
                  ) : materialChoices.length > 0 ? (
                    <SelectDropdown
                      label="Material"
                      placeholder="Select material"
                      choices={materialChoices}
                      value={form.material_id || null}
                      onChange={(v) => setForm(f => ({ ...f, material_id: String(v ?? '') }))}
                    />
                  ) : (
                    <Input label="Material" value="" placeholder="No materials available" disabled onChange={() => {}} />
                  )
                )}
                <Input
                  label="Received Quantity"
                  placeholder="e.g. 50"
                  value={form.received_qty}
                  onChange={(v) => setForm(f => ({ ...f, received_qty: String(v ?? '') }))}
                  required
                />
              </Group>

              <Group grow align="flex-start">
                <SelectDropdown
                  label="Unit"
                  choices={[{ text: 'kg', value: 'kg' }, { text: 'liter', value: 'liter' }, { text: 'pcs', value: 'pcs' }, { text: 'drum', value: 'drum' }, { text: 'bottle', value: 'bottle' }]}
                  value={form.unit}
                  onChange={(v) => setForm(f => ({ ...f, unit: String(v ?? 'kg') }))}
                />
                <SelectDropdown
                  label="Packaging Condition"
                  choices={[{ text: 'Good', value: 'good' }, { text: 'Acceptable (notes required)', value: 'acceptable' }, { text: 'Damaged (QC Hold)', value: 'damaged' }]}
                  value={form.packaging_condition}
                  onChange={(v) => setForm(f => ({ ...f, packaging_condition: String(v ?? 'good') }))}
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
                label="Notes"
                placeholder={form.packaging_condition !== 'good' ? 'Required — describe packaging condition' : 'Optional notes'}
                value={form.notes}
                onChange={(v) => setForm(f => ({ ...f, notes: String(v ?? '') }))}
              />

              {form.packaging_condition === 'damaged' && (
                <Alert icon={<IconAlertTriangle size={16} />} color="red" variant="light">
                  Damaged packaging — batch will be created with <strong>Hold</strong> status for QC attention.
                </Alert>
              )}

              <Group justify="flex-end">
                <Button onClick={handleSave} loading={saving}>
                  Receive Material
                </Button>
              </Group>
            </Stack>
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="history" pt="md">
          <CollectionList
            collection="raw_material_receipts"
            enableSearch
            enableSort
            enableHeaderMenu
            enableResize
            fields={['receipt_number', 'order_id', 'material_id', 'received_qty', 'unit', 'packaging_condition', 'is_unplanned', 'date_created']}
            onItemClick={(item) => router.push(`/warehouse/receive/${item.id}`)}
          />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}
