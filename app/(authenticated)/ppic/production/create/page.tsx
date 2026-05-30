'use client';

import { Stack, Title, Text, Group, Button, Alert, Paper, Divider } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { notifications } from '@mantine/notifications';
import { IconInfoCircle, IconArrowRight } from '@tabler/icons-react';
import { Input } from '@/components/ui/input';
import { SelectDropdown } from '@/components/ui/select-dropdown';
import { DateTime } from '@/components/ui/datetime';
import { Textarea } from '@/components/ui/textarea';
import dayjs from 'dayjs';

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

  const todayStr = useMemo(() => dayjs().format('YYYY-MM-DD'), []);

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

  // Date minimums: Start ≥ today, End ≥ Start, Due ≥ End
  const endDateMin = useMemo(() => {
    return form.planned_start_date ? dayjs(form.planned_start_date).format('YYYY-MM-DD') : todayStr;
  }, [form.planned_start_date, todayStr]);

  const dueDateMin = useMemo(() => {
    return form.planned_end_date ? dayjs(form.planned_end_date).format('YYYY-MM-DD') : (form.planned_start_date ?? todayStr);
  }, [form.planned_end_date, form.planned_start_date, todayStr]);

  const handleStartDateChange = (v: string | null) => {
    setForm((f) => {
      const updated = { ...f, planned_start_date: v };
      // Clear end date if it's now before start
      if (v && f.planned_end_date && dayjs(f.planned_end_date).isBefore(dayjs(v))) {
        updated.planned_end_date = null;
        updated.due_date = null;
      }
      return updated;
    });
  };

  const handleEndDateChange = (v: string | null) => {
    setForm((f) => {
      const updated = { ...f, planned_end_date: v };
      // Clear due date if it's now before end
      if (v && f.due_date && dayjs(f.due_date).isBefore(dayjs(v))) {
        updated.due_date = null;
      }
      return updated;
    });
  };

  const handleSave = async () => {
    const errors: string[] = [];
    if (!form.product_id) errors.push('Product is required');
    const qty = typeof form.planned_qty === 'number' ? form.planned_qty : parseFloat(String(form.planned_qty));
    if (!qty || isNaN(qty) || qty <= 0) errors.push('Planned quantity must be a positive number');
    if (!form.unit) errors.push('Unit is required (select a product first)');
    if (!form.priority) errors.push('Priority is required');
    if (!form.planned_start_date) errors.push('Planned start date is required');
    if (!form.planned_end_date) errors.push('Planned end date is required');
    if (!form.due_date) errors.push('Due date is required');

    if (form.planned_start_date && form.planned_end_date) {
      if (dayjs(form.planned_end_date).isBefore(dayjs(form.planned_start_date))) {
        errors.push('End date must be on or after start date');
      }
    }
    if (form.planned_end_date && form.due_date) {
      if (dayjs(form.due_date).isBefore(dayjs(form.planned_end_date))) {
        errors.push('Due date must be on or after end date');
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
          {/* Product + Quantity */}
          <Group grow align="flex-start">
            {loadingData ? (
              <Input label="Product" placeholder="Loading products..." disabled onChange={() => {}} />
            ) : productChoices.length > 0 ? (
              <SelectDropdown
                label="Product"
                placeholder="Select product to produce..."
                choices={productChoices}
                value={form.product_id || null}
                onChange={handleProductChange}
                required
              />
            ) : (
              <Input label="Product" value="" placeholder="No active products available" disabled onChange={() => {}} />
            )}
            <Input
              label="Planned Quantity"
              placeholder="e.g. 100.5"
              type="float"
              value={form.planned_qty || null}
              onChange={(v) => setForm((f) => ({ ...f, planned_qty: v ?? '' }))}
              required
              min={0.01}
              step={0.01}
            />
            <Input
              label="Unit"
              value={form.unit || ''}
              placeholder="Auto-filled from product"
              disabled
              onChange={() => {}}
            />
          </Group>

          <SelectDropdown
            label="Priority"
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

          {/* Date section */}
          <Divider label="Schedule" labelPosition="left" mt="xs" />
          <Text size="xs" c="dimmed">
            Dates must follow this order:
            <strong> Start Date</strong>
            <IconArrowRight size={12} style={{ verticalAlign: 'middle', margin: '0 4px' }} />
            <strong>End Date</strong>
            <IconArrowRight size={12} style={{ verticalAlign: 'middle', margin: '0 4px' }} />
            <strong>Due Date</strong>
          </Text>
          <Group grow align="flex-start">
            <DateTime
              label="Planned Start"
              placeholder="When production begins"
              type="date"
              value={form.planned_start_date}
              onChange={handleStartDateChange}
              minDate={todayStr}
              required
            />
            <DateTime
              label="Planned End"
              placeholder="When production finishes"
              type="date"
              value={form.planned_end_date}
              onChange={handleEndDateChange}
              minDate={endDateMin}
              required
            />
            <DateTime
              label="Due Date"
              placeholder="Delivery deadline"
              type="date"
              value={form.due_date}
              onChange={(v) => setForm((f) => ({ ...f, due_date: v }))}
              minDate={dueDateMin}
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
