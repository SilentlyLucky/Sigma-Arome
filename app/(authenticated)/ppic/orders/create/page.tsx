'use client';

import { Stack, Title, Text, Alert, Paper, Group, Button } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import { Input } from '@/components/ui/input';
import { SelectDropdown } from '@/components/ui/select-dropdown';
import { DateTime } from '@/components/ui/datetime';
import { Textarea } from '@/components/ui/textarea';

/**
 * Create Raw Material Order — custom form with unit auto-fill.
 * When a material is selected, the Unit field is automatically populated
 * from the material's master data and locked (read-only) to prevent mismatches.
 */

interface RawMaterial { id: string; name: string; code: string; unit: string }
interface Supplier { id: string; supplier_name: string }

export default function CreateRawMaterialOrderPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  const [form, setForm] = useState({
    material_id: '',
    supplier_id: '',
    ordered_qty: '' as string | number,
    unit: '',           // auto-filled from material master, locked after selection
    expected_arrival_date: null as string | null,
    priority: 'normal',
    notes: '',
  });

  useEffect(() => {
    Promise.all([
      fetch('/api/items/raw_materials?filter[status][_eq]=active&fields[]=id&fields[]=name&fields[]=code&fields[]=unit&limit=200')
        .then(r => r.json()).then(d => setMaterials(d?.data ?? [])),
      fetch('/api/items/suppliers?filter[status][_eq]=active&fields[]=id&fields[]=supplier_name&limit=100')
        .then(r => r.json()).then(d => setSuppliers(d?.data ?? [])),
    ]).finally(() => setLoading(false));
  }, []);

  // When a material is selected, auto-fill the unit from master data and lock it
  const handleMaterialChange = (v: string | number | boolean | null) => {
    const materialId = String(v ?? '');
    const selected = materials.find(m => m.id === materialId);
    setForm(f => ({
      ...f,
      material_id: materialId,
      unit: selected?.unit ?? '',   // auto-fill from master data
    }));
  };

  const materialChoices = materials.map(m => ({
    text: `${m.name} (${m.code})`,
    value: m.id,
  }));

  const supplierChoices = suppliers.map(s => ({
    text: s.supplier_name,
    value: s.id,
  }));

  const selectedMaterial = materials.find(m => m.id === form.material_id);

  // Shared validation — returns the parsed qty or null if invalid
  const validate = (): number | null => {
    const errors: string[] = [];
    if (!form.material_id) errors.push('Material is required');
    const qty = typeof form.ordered_qty === 'number'
      ? form.ordered_qty
      : parseFloat(String(form.ordered_qty));
    if (!qty || isNaN(qty) || qty <= 0) errors.push('Quantity must be a positive number');
    if (!form.unit) errors.push('Unit is required — select a material first');
    if (!form.priority) errors.push('Priority is required');
    if (errors.length > 0) {
      notifications.show({ title: 'Validation', message: errors.join('. '), color: 'red' });
      return null;
    }
    return qty;
  };

  // targetStatus: 'draft' → Save Draft  |  'ordered' → Submit (bypasses draft)
  const handleSave = async (targetStatus: 'draft' | 'ordered') => {
    const qty = validate();
    if (qty === null) return;

    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        material_id: form.material_id,
        ordered_qty: qty,
        unit: form.unit,
        priority: form.priority,
        // Passing status here overrides the backend default of 'draft'
        status: targetStatus,
      };
      if (form.supplier_id) body.supplier_id = form.supplier_id;
      if (form.expected_arrival_date) body.expected_arrival_date = form.expected_arrival_date;
      if (form.notes) body.notes = form.notes;

      const res = await fetch('/api/items/raw_material_orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.errors?.[0]?.message ?? err?.error ?? 'Save failed');
      }

      if (targetStatus === 'ordered') {
        notifications.show({
          title: 'Order Submitted',
          message: 'Raw material order submitted and is now active in the pipeline.',
          color: 'green',
        });
      } else {
        notifications.show({
          title: 'Draft Saved',
          message: 'Order saved as draft. Open it to submit when ready.',
          color: 'blue',
        });
      }
      router.push('/ppic/orders');
    } catch (err) {
      notifications.show({ title: 'Error', message: err instanceof Error ? err.message : 'Failed', color: 'red' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Create Raw Material Order</Title>
        <Text c="dimmed" size="sm">
          Order raw materials from suppliers for internal production needs.
        </Text>
      </div>

      <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
        Select a <strong>Material</strong> — the unit is automatically filled from the master data and
        cannot be changed to prevent data mismatches. Use <strong>Submit Order</strong> to send it
        directly into the pipeline, or <strong>Save Draft</strong> to finish later.
      </Alert>

      <Paper p="md" radius="md" withBorder>
        <Stack gap="sm">
          {/* Material — drives unit auto-fill */}
          {loading ? (
            <Input label="Material *" placeholder="Loading materials..." disabled onChange={() => {}} />
          ) : materialChoices.length > 0 ? (
            <SelectDropdown
              label="Material *"
              placeholder="Select raw material to order..."
              choices={materialChoices}
              value={form.material_id || null}
              onChange={handleMaterialChange}
              required
            />
          ) : (
            <Input label="Material *" value="" placeholder="No active materials available" disabled onChange={() => {}} />
          )}

          {/* Supplier (optional) */}
          {loading ? (
            <Input label="Supplier (optional)" placeholder="Loading suppliers..." disabled onChange={() => {}} />
          ) : supplierChoices.length > 0 ? (
            <SelectDropdown
              label="Supplier (optional)"
              placeholder="Select supplier..."
              choices={supplierChoices}
              value={form.supplier_id || null}
              onChange={(v) => setForm(f => ({ ...f, supplier_id: String(v ?? '') }))}
              allowNone
            />
          ) : (
            <Input label="Supplier (optional)" value="" placeholder="No active suppliers" disabled onChange={() => {}} />
          )}

          <Group grow align="flex-start">
            <Input
              label="Quantity *"
              placeholder="e.g. 50"
              type="float"
              value={form.ordered_qty || null}
              onChange={(v) => setForm(f => ({ ...f, ordered_qty: v ?? '' }))}
              required
              min={0.001}
              step={0.001}
            />
            {/* Unit: auto-filled from material master, locked to prevent mismatches */}
            <Input
              label={
                form.unit
                  ? `Unit (auto-filled from ${selectedMaterial?.name ?? 'material'})`
                  : 'Unit (select a material first)'
              }
              value={form.unit}
              placeholder="Auto-filled when material is selected"
              disabled
              onChange={() => {}}
            />
          </Group>

          <Group grow align="flex-start">
            <SelectDropdown
              label="Priority *"
              placeholder="Select priority..."
              choices={[
                { text: 'Low', value: 'low' },
                { text: 'Normal', value: 'normal' },
                { text: 'High', value: 'high' },
                { text: 'Urgent', value: 'urgent' },
              ]}
              value={form.priority}
              onChange={(v) => setForm(f => ({ ...f, priority: String(v ?? 'normal') }))}
              required
            />
            <DateTime
              label="Expected Arrival Date"
              placeholder="Select expected delivery date"
              type="date"
              value={form.expected_arrival_date}
              onChange={(v) => setForm(f => ({ ...f, expected_arrival_date: v }))}
            />
          </Group>

          <Textarea
            label="Notes"
            placeholder="Order notes / reason (optional)..."
            value={form.notes}
            onChange={(v) => setForm(f => ({ ...f, notes: String(v ?? '') }))}
          />
        </Stack>
      </Paper>

      <Group justify="flex-end">
        <Button variant="subtle" onClick={() => router.push('/ppic/orders')}>
          Cancel
        </Button>
        <Button
          variant="default"
          onClick={() => handleSave('draft')}
          loading={saving}
        >
          Save Draft
        </Button>
        <Button
          color="teal"
          onClick={() => handleSave('ordered')}
          loading={saving}
        >
          Submit Order
        </Button>
      </Group>
    </Stack>
  );
}
