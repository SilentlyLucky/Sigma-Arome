'use client';

import { Stack, Title, Text, Group, Button, Alert, Paper } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import { IconInfoCircle } from '@tabler/icons-react';
import { Input } from '@/components/ui/input';
import { SelectDropdown } from '@/components/ui/select-dropdown';
import { DateTime } from '@/components/ui/datetime';
import { Textarea } from '@/components/ui/textarea';

/**
 * Custom Production Order create form.
 * BOM dropdown is dynamically filtered based on selected product.
 */

interface Product { id: string; name: string; code: string }
interface BOM { id: string; name: string; product_id: string; version: string; is_active: boolean }

export default function CreateProductionOrderPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [allBoms, setAllBoms] = useState<BOM[]>([]);
  const [form, setForm] = useState({
    product_id: '',
    bom_id: '',
    planned_qty: '',
    unit: 'pcs',
    priority: 'normal',
    planned_start_date: null as string | null,
    planned_end_date: null as string | null,
    due_date: null as string | null,
    notes: '',
  });

  // Fetch products and BOMs on mount
  const [loadingData, setLoadingData] = useState(true);
  useEffect(() => {
    Promise.all([
      fetch('/api/items/products?fields[]=id&fields[]=name&fields[]=code&filter[status][_eq]=active&limit=100')
        .then((r) => r.json())
        .then((d) => setProducts(d?.data ?? [])),
      fetch('/api/items/boms?fields[]=id&fields[]=name&fields[]=product_id&fields[]=version&fields[]=is_active&filter[is_active][_eq]=true&limit=100')
        .then((r) => r.json())
        .then((d) => setAllBoms(d?.data ?? [])),
    ]).finally(() => setLoadingData(false));
  }, []);

  // Filter BOMs by selected product
  const filteredBoms = form.product_id
    ? allBoms.filter((b) => b.product_id === form.product_id)
    : [];

  // Reset BOM when product changes
  const handleProductChange = (v: string | number | boolean | null) => {
    const productId = String(v ?? '');
    setForm((f) => ({ ...f, product_id: productId, bom_id: '' }));
  };

  const productChoices = products.map((p) => ({ text: `${p.name} (${p.code})`, value: p.id }));
  const bomChoices = filteredBoms.map((b) => ({ text: `${b.name} (v${b.version})`, value: b.id }));

  const handleSave = async () => {
    if (!form.product_id || !form.planned_qty) {
      notifications.show({ title: 'Validation', message: 'Product and planned quantity are required', color: 'red' });
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        product_id: form.product_id,
        planned_qty: parseFloat(form.planned_qty),
        unit: form.unit,
        priority: form.priority,
        notes: form.notes || null,
      };
      if (form.bom_id) body.bom_id = form.bom_id;
      if (form.planned_start_date) body.planned_start_date = form.planned_start_date;
      if (form.planned_end_date) body.planned_end_date = form.planned_end_date;
      if (form.due_date) body.due_date = form.due_date;

      const res = await fetch('/api/items/production_orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.errors?.[0]?.message ?? 'Save failed');
      }
      notifications.show({ title: 'Created', message: 'Production order created', color: 'green' });
      router.push('/ppic/production');
    } catch (err) {
      notifications.show({ title: 'Error', message: err instanceof Error ? err.message : 'Failed', color: 'red' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Create Production Order</Title>
        <Text c="dimmed" size="sm">Plan a new production run. Select product first, then choose the matching BOM/Formula.</Text>
      </div>

      <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
        Order number is auto-generated. Status starts as <strong>Draft</strong>.
        BOM options are filtered to show only formulas for the selected product.
      </Alert>

      <Paper p="md" radius="md" withBorder>
        <Stack gap="sm">
          <Group grow align="flex-start">
            {loadingData ? (
              <Input label="Product" placeholder="Loading products..." disabled onChange={() => {}} />
            ) : productChoices.length > 0 ? (
              <SelectDropdown
                label="Product"
                placeholder="Select product to produce"
                choices={productChoices}
                value={form.product_id || null}
                onChange={handleProductChange}
              />
            ) : (
              <Input label="Product" value="" placeholder="No active products available" disabled onChange={() => {}} />
            )}
            {form.product_id && bomChoices.length > 0 ? (
              <SelectDropdown
                label="BOM / Formula"
                placeholder="Select BOM"
                choices={bomChoices}
                value={form.bom_id || null}
                onChange={(v) => setForm((f) => ({ ...f, bom_id: String(v ?? '') }))}
                allowNone
              />
            ) : (
              <Input
                label="BOM / Formula"
                value={!form.product_id ? '' : 'No active BOM for this product'}
                placeholder="Select a product first"
                disabled
                onChange={() => {}}
              />
            )}
          </Group>

          <Group grow align="flex-start">
            <Input
              label="Planned Quantity"
              placeholder="e.g. 100"
              value={form.planned_qty}
              onChange={(v) => setForm((f) => ({ ...f, planned_qty: String(v ?? '') }))}
              required
            />
            <SelectDropdown
              label="Unit"
              choices={[
                { text: 'pcs', value: 'pcs' },
                { text: 'kg', value: 'kg' },
                { text: 'liter', value: 'liter' },
                { text: 'bottle', value: 'bottle' },
              ]}
              value={form.unit}
              onChange={(v) => setForm((f) => ({ ...f, unit: String(v ?? 'pcs') }))}
            />
          </Group>

          <Group grow align="flex-start">
            <SelectDropdown
              label="Priority"
              choices={[
                { text: 'Low', value: 'low' },
                { text: 'Normal', value: 'normal' },
                { text: 'High', value: 'high' },
                { text: 'Urgent', value: 'urgent' },
              ]}
              value={form.priority}
              onChange={(v) => setForm((f) => ({ ...f, priority: String(v ?? 'normal') }))}
            />
            <DateTime
              label="Due Date"
              value={form.due_date}
              onChange={(v) => setForm((f) => ({ ...f, due_date: v }))}
            />
          </Group>

          <Group grow align="flex-start">
            <DateTime
              label="Planned Start"
              value={form.planned_start_date}
              onChange={(v) => setForm((f) => ({ ...f, planned_start_date: v }))}
            />
            <DateTime
              label="Planned End"
              value={form.planned_end_date}
              onChange={(v) => setForm((f) => ({ ...f, planned_end_date: v }))}
            />
          </Group>

          <Textarea
            label="Notes"
            placeholder="Production notes (optional)"
            value={form.notes}
            onChange={(v) => setForm((f) => ({ ...f, notes: String(v ?? '') }))}
          />
        </Stack>
      </Paper>

      <Group justify="flex-end">
        <Button variant="subtle" onClick={() => router.push('/ppic/production')}>Cancel</Button>
        <Button onClick={handleSave} loading={saving}>Create Production Order</Button>
      </Group>
    </Stack>
  );
}
