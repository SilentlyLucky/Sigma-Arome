'use client';

import { Stack, Title, Text, Group, Button, Alert, Paper } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { notifications } from '@mantine/notifications';
import { IconInfoCircle } from '@tabler/icons-react';
import { Input } from '@/components/ui/input';
import { SelectDropdown } from '@/components/ui/select-dropdown';
import { DateTime } from '@/components/ui/datetime';
import { Textarea } from '@/components/ui/textarea';
import dayjs from 'dayjs';

/**
 * Custom Production Order create form.
 * - Product selection auto-resolves the matching active BOM (1 product = 1 formula).
 * - Unit is auto-populated from the product's metadata.
 * - All fields except Notes are required.
 * - Date pickers are date-only (no time), cannot be in the past.
 * - End date cannot be earlier than start date.
 */

interface Product { id: string; name: string; code: string; unit: string }
interface BOM { id: string; name: string; product_id: string; version: string; is_active: boolean }

export default function CreateProductionOrderPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [allBoms, setAllBoms] = useState<BOM[]>([]);
  const [form, setForm] = useState({
    product_id: '',
    bom_id: '',
    planned_qty: '' as string | number,
    unit: '',
    priority: 'normal',
    planned_start_date: null as string | null,
    planned_end_date: null as string | null,
    due_date: null as string | null,
    notes: '',
  });

  // Today's date as minimum for date pickers (no past dates)
  const todayStr = useMemo(() => dayjs().format('YYYY-MM-DD'), []);

  // Fetch products and BOMs on mount
  const [loadingData, setLoadingData] = useState(true);
  useEffect(() => {
    Promise.all([
      fetch('/api/items/products?fields[]=id&fields[]=name&fields[]=code&fields[]=unit&filter[status][_eq]=active&limit=100')
        .then((r) => r.json())
        .then((d) => setProducts(d?.data ?? [])),
      fetch('/api/items/boms?fields[]=id&fields[]=name&fields[]=product_id&fields[]=version&fields[]=is_active&filter[is_active][_eq]=true&limit=100')
        .then((r) => r.json())
        .then((d) => setAllBoms(d?.data ?? [])),
    ]).finally(() => setLoadingData(false));
  }, []);

  // Auto-resolve BOM when product changes (1 product = 1 active formula)
  const handleProductChange = (v: string | number | boolean | null) => {
    const productId = String(v ?? '');
    const selectedProduct = products.find((p) => p.id === productId);
    const matchingBom = allBoms.find((b) => b.product_id === productId);
    setForm((f) => ({
      ...f,
      product_id: productId,
      bom_id: matchingBom?.id ?? '',
      unit: selectedProduct?.unit ?? '',
    }));
  };

  const productChoices = products.map((p) => ({ text: `${p.name} (${p.code})`, value: p.id }));

  // Resolved BOM name for display
  const resolvedBomName = useMemo(() => {
    if (!form.bom_id) return '';
    const bom = allBoms.find((b) => b.id === form.bom_id);
    return bom ? `${bom.name} (v${bom.version})` : '';
  }, [form.bom_id, allBoms]);

  // End date minimum = start date (if set), otherwise today
  const endDateMin = useMemo(() => {
    if (form.planned_start_date) {
      return dayjs(form.planned_start_date).format('YYYY-MM-DD');
    }
    return todayStr;
  }, [form.planned_start_date, todayStr]);

  const handleSave = async () => {
    // Validate all required fields (everything except notes)
    const errors: string[] = [];
    if (!form.product_id) errors.push('Product is required');
    const qty = typeof form.planned_qty === 'number' ? form.planned_qty : parseFloat(String(form.planned_qty));
    if (!qty || isNaN(qty) || qty <= 0) errors.push('Planned quantity must be a positive number');
    if (!form.unit) errors.push('Unit is required (select a product first)');
    if (!form.priority) errors.push('Priority is required');
    if (!form.due_date) errors.push('Due date is required');
    if (!form.planned_start_date) errors.push('Planned start date is required');
    if (!form.planned_end_date) errors.push('Planned end date is required');

    // Validate end date >= start date
    if (form.planned_start_date && form.planned_end_date) {
      if (dayjs(form.planned_end_date).isBefore(dayjs(form.planned_start_date))) {
        errors.push('Planned end date cannot be earlier than start date');
      }
    }

    if (errors.length > 0) {
      notifications.show({ title: 'Validation', message: errors.join('. '), color: 'red' });
      return;
    }

    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        product_id: form.product_id,
        planned_qty: qty,
        unit: form.unit,
        priority: form.priority,
        planned_start_date: form.planned_start_date,
        planned_end_date: form.planned_end_date,
        due_date: form.due_date,
        notes: form.notes || null,
      };
      if (form.bom_id) body.bom_id = form.bom_id;

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
        <Text c="dimmed" size="sm">Plan a new production run. Select a product — the matching formula and unit are resolved automatically.</Text>
      </div>

      <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
        Order number is auto-generated. Status starts as <strong>Draft</strong>.
        Each product has one active formula — it is auto-selected when you pick a product.
      </Alert>

      <Paper p="md" radius="md" withBorder>
        <Stack gap="sm">
          <Group grow align="flex-start">
            {loadingData ? (
              <Input label="Product (Formula) *" placeholder="Loading products..." disabled onChange={() => {}} />
            ) : productChoices.length > 0 ? (
              <SelectDropdown
                label="Product (Formula) *"
                placeholder="Select product to produce..."
                choices={productChoices}
                value={form.product_id || null}
                onChange={handleProductChange}
                required
              />
            ) : (
              <Input label="Product (Formula) *" value="" placeholder="No active products available" disabled onChange={() => {}} />
            )}
            <Input
              label="Resolved Formula"
              value={resolvedBomName}
              placeholder={form.product_id ? 'No active formula for this product' : 'Select a product first'}
              disabled
              onChange={() => {}}
            />
          </Group>

          <Group grow align="flex-start">
            <Input
              label="Planned Quantity *"
              placeholder="e.g. 100.5"
              type="float"
              value={form.planned_qty || null}
              onChange={(v) => setForm((f) => ({ ...f, planned_qty: v ?? '' }))}
              required
              min={0.01}
              step={0.01}
            />
            <Input
              label="Unit *"
              value={form.unit || ''}
              placeholder="Auto-filled from product"
              disabled
              onChange={() => {}}
            />
          </Group>

          <Group grow align="flex-start">
            <SelectDropdown
              label="Priority *"
              placeholder="Select priority level..."
              choices={[
                { text: 'Low', value: 'low' },
                { text: 'Normal', value: 'normal' },
                { text: 'High', value: 'high' },
                { text: 'Urgent', value: 'urgent' },
              ]}
              value={form.priority}
              onChange={(v) => setForm((f) => ({ ...f, priority: String(v ?? 'normal') }))}
              required
            />
            <DateTime
              label="Due Date *"
              placeholder="Select due date"
              type="date"
              value={form.due_date}
              onChange={(v) => setForm((f) => ({ ...f, due_date: v }))}
              minDate={todayStr}
              required
            />
          </Group>

          <Group grow align="flex-start">
            <DateTime
              label="Planned Start *"
              placeholder="Select start date"
              type="date"
              value={form.planned_start_date}
              onChange={(v) => {
                setForm((f) => {
                  const updated = { ...f, planned_start_date: v };
                  // If end date is now before start date, clear it
                  if (v && f.planned_end_date && dayjs(f.planned_end_date).isBefore(dayjs(v))) {
                    updated.planned_end_date = null;
                  }
                  return updated;
                });
              }}
              minDate={todayStr}
              required
            />
            <DateTime
              label="Planned End *"
              placeholder="Select end date"
              type="date"
              value={form.planned_end_date}
              onChange={(v) => setForm((f) => ({ ...f, planned_end_date: v }))}
              minDate={endDateMin}
              required
            />
          </Group>

          <Textarea
            label="Notes"
            placeholder="Enter production notes (optional)..."
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
