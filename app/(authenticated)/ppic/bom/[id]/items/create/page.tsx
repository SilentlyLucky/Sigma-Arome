'use client';

import { Stack, Title, Text, Alert, Group, Button, Paper } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import { Input } from '@/components/ui/input';
import { SelectDropdown } from '@/components/ui/select-dropdown';

/**
 * Add Material to Product Formula — custom form.
 * - Formula field is pre-filled from the URL param (the formula the user came from).
 * - When a material is selected, the Unit is auto-filled from the material's metadata.
 * - Scrap percentage is removed.
 */

interface RawMaterial { id: string; name: string; code: string; unit: string }
interface BOM { id: string; name: string; product_id: string; version: string }

export default function CreateBOMItemPage() {
  const router = useRouter();
  const params = useParams();
  const bomId = params.id as string;

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [boms, setBoms] = useState<BOM[]>([]);

  const [form, setForm] = useState({
    bom_id: bomId, // Pre-filled from URL
    material_id: '',
    qty_per_unit: '' as string | number,
    unit: '',
  });

  // Fetch materials and product formulas on mount
  useEffect(() => {
    Promise.all([
      fetch('/api/items/raw_materials?fields[]=id&fields[]=name&fields[]=code&fields[]=unit&filter[status][_eq]=active&limit=200')
        .then((r) => r.json())
        .then((d) => setMaterials(d?.data ?? [])),
      fetch('/api/items/boms?fields[]=id&fields[]=name&fields[]=version&fields[]=product_id&limit=100')
        .then((r) => r.json())
        .then((d) => setBoms(d?.data ?? [])),
    ]).finally(() => setLoading(false));
  }, []);

  // When material changes, auto-fill unit from material metadata
  const handleMaterialChange = (v: string | number | boolean | null) => {
    const materialId = String(v ?? '');
    const selectedMaterial = materials.find((m) => m.id === materialId);
    setForm((f) => ({
      ...f,
      material_id: materialId,
      unit: selectedMaterial?.unit ?? f.unit,
    }));
  };

  const materialChoices = materials.map((m) => ({ text: `${m.name} (${m.code})`, value: m.id }));
  const bomChoices = boms.map((b) => ({ text: `${b.name} (v${b.version})`, value: b.id }));

  const handleSave = async () => {
    const errors: string[] = [];
    if (!form.bom_id) errors.push('Product formula is required');
    if (!form.material_id) errors.push('Material is required');
    const qty = typeof form.qty_per_unit === 'number' ? form.qty_per_unit : parseFloat(String(form.qty_per_unit));
    if (!qty || isNaN(qty) || qty <= 0) errors.push('Quantity per unit must be a positive number');
    if (!form.unit) errors.push('Unit is required');

    if (errors.length > 0) {
      notifications.show({ title: 'Validation', message: errors.join('. '), color: 'red' });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/items/bom_items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bom_id: form.bom_id,
          material_id: form.material_id,
          qty_per_unit: qty,
          unit: form.unit,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.errors?.[0]?.message ?? 'Save failed');
      }
      notifications.show({ title: 'Added', message: 'Material added to product formula', color: 'green' });
      router.push(`/ppic/bom/${bomId}`);
    } catch (err) {
      notifications.show({ title: 'Error', message: err instanceof Error ? err.message : 'Failed', color: 'red' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Add Material to Product Formula</Title>
        <Text c="dimmed" size="sm">
          Select a raw material and specify the quantity needed per unit of finished product.
        </Text>
      </div>
      <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
        <strong>Qty per Unit</strong> = how much of this material is needed for 1 unit of product.
        The unit is auto-filled from the material&apos;s metadata.
      </Alert>

      <Paper p="md" radius="md" withBorder>
        <Stack gap="sm">
          {/* Product formula field - pre-filled but changeable */}
          {loading ? (
            <Input label="Product Formula" placeholder="Loading..." disabled onChange={() => {}} />
          ) : bomChoices.length > 0 ? (
            <SelectDropdown
              label="Product Formula"
              placeholder="Select product formula..."
              choices={bomChoices}
              value={form.bom_id || null}
              onChange={(v) => setForm((f) => ({ ...f, bom_id: String(v ?? '') }))}
              required
            />
          ) : (
            <Input label="Product Formula" value="" placeholder="No product formulas available" disabled onChange={() => {}} />
          )}

          {/* Material selection — auto-fills unit */}
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
            />
          ) : (
            <Input label="Material" value="" placeholder="No active materials available" disabled onChange={() => {}} />
          )}

          <Group grow align="flex-start">
            <Input
              label="Qty per Unit"
              placeholder="e.g. 0.5"
              type="float"
              value={form.qty_per_unit || null}
              onChange={(v) => setForm((f) => ({ ...f, qty_per_unit: v ?? '' }))}
              required
              min={0.001}
              step={0.001}
            />
            {/* Unit auto-filled from material, but editable if needed */}
            <Input
              label="Unit"
              value={form.unit}
              placeholder="Auto-filled from material"
              disabled
              onChange={() => {}}
            />
          </Group>
        </Stack>
      </Paper>

      <Group justify="flex-end">
        <Button variant="subtle" onClick={() => router.push(`/ppic/bom/${bomId}`)}>Cancel</Button>
        <Button onClick={handleSave} loading={saving}>Add Material</Button>
      </Group>
    </Stack>
  );
}
