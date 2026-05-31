'use client';

import { Stack, Title, Text, Group, Button, Paper } from '@mantine/core';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import { Input } from '@/components/ui/input';
import { SelectDropdown } from '@/components/ui/select-dropdown';

interface RawMaterial { id: string; name: string; code: string; unit: string }

export default function CreateMaterialRequestItemPage() {
  const router = useRouter();
  const params = useParams();
  const requestId = params.id as string;

  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    material_id: '',
    requested_qty: '' as string | number,
    unit: '',   // auto-filled from material master, locked after selection
  });

  useEffect(() => {
    fetch('/api/items/raw_materials?filter[status][_eq]=active&fields[]=id&fields[]=name&fields[]=code&fields[]=unit&limit=200')
      .then(r => r.json())
      .then(d => setMaterials(d?.data ?? []))
      .finally(() => setLoading(false));
  }, []);

  const handleMaterialChange = (v: string | number | boolean | null) => {
    const materialId = String(v ?? '');
    const selected = materials.find(m => m.id === materialId);
    setForm(f => ({
      ...f,
      material_id: materialId,
      unit: selected?.unit ?? '',   // auto-fill unit from master data
    }));
  };

  const selectedMaterial = materials.find(m => m.id === form.material_id);

  const materialChoices = materials.map(m => ({
    text: `${m.name} (${m.code})`,
    value: m.id,
  }));

  const handleSave = async () => {
    const errors: string[] = [];
    if (!form.material_id) errors.push('Material is required');
    const qty = typeof form.requested_qty === 'number'
      ? form.requested_qty
      : parseFloat(String(form.requested_qty));
    if (!qty || isNaN(qty) || qty <= 0) errors.push('Quantity must be a positive number');
    if (!form.unit) errors.push('Unit is required — select a material first');

    if (errors.length > 0) {
      notifications.show({ title: 'Validation', message: errors.join('. '), color: 'red' });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/items/material_request_items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          material_request_id: requestId,
          material_id: form.material_id,
          requested_qty: qty,
          unit: form.unit,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.errors?.[0]?.message ?? 'Save failed');
      }
      notifications.show({ title: 'Item Added', message: `${selectedMaterial?.name ?? 'Material'} added to request.`, color: 'green' });
      router.push(`/ppic/requests/${requestId}`);
    } catch (err) {
      notifications.show({ title: 'Error', message: err instanceof Error ? err.message : 'Failed', color: 'red' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Add Material to Request</Title>
        <Text c="dimmed" size="sm">
          Select a raw material — the unit is auto-filled from master data and locked to prevent mismatches.
        </Text>
      </div>

      <Paper p="md" radius="md" withBorder>
        <Stack gap="sm">
          {loading ? (
            <Input label="Material" placeholder="Loading materials..." disabled onChange={() => {}} />
          ) : materialChoices.length > 0 ? (
            <SelectDropdown
              label="Material"
              placeholder="Select raw material..."
              choices={materialChoices}
              value={form.material_id || null}
              onChange={handleMaterialChange}
              required
              searchable
            />
          ) : (
            <Input label="Material" value="" placeholder="No active materials available" disabled onChange={() => {}} />
          )}

          <Group grow align="flex-start">
            <Input
              label="Requested Quantity"
              placeholder="e.g. 10"
              type="float"
              value={form.requested_qty || null}
              onChange={(v) => setForm(f => ({ ...f, requested_qty: v ?? '' }))}
              required
              min={0.001}
              step={0.001}
            />
            <Input
              label={form.unit ? `Unit (from ${selectedMaterial?.name ?? 'material'})` : 'Unit (select a material first)'}
              value={form.unit}
              placeholder="Auto-filled when material is selected"
              disabled
              onChange={() => {}}
            />
          </Group>
        </Stack>
      </Paper>

      <Group justify="flex-end">
        <Button variant="subtle" onClick={() => router.push(`/ppic/requests/${requestId}`)}>Cancel</Button>
        <Button color="teal" loading={saving} onClick={handleSave}>Add to Request</Button>
      </Group>
    </Stack>
  );
}
