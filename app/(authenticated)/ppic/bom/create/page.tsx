'use client';

import { Stack, Title, Text, Alert, Group, Button, Paper } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import { Input } from '@/components/ui/input';
import { SelectDropdown } from '@/components/ui/select-dropdown';
import { Textarea } from '@/components/ui/textarea';

interface Product { id: string; name: string; code: string }

export default function CreateBOMPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);

  const [form, setForm] = useState({
    product_id: '',
    product_name: '',
    version: '1',
    is_active: true,
    notes: '',
  });

  useEffect(() => {
    fetch('/api/items/products?fields[]=id&fields[]=name&fields[]=code&filter[status][_eq]=active&limit=100')
      .then((r) => r.json())
      .then((d) => setProducts(d?.data ?? []))
      .finally(() => setLoading(false));
  }, []);

  const productChoices = products.map((p) => ({ text: `${p.name} (${p.code})`, value: p.id }));

  const handleProductChange = (v: string | number | boolean | null) => {
    const productId = String(v ?? '');
    const product = products.find((p) => p.id === productId);
    setForm((f) => ({ ...f, product_id: productId, product_name: product?.name ?? '' }));
  };

  const handleSave = async () => {
    if (!form.product_id) {
      notifications.show({ title: 'Validation', message: 'Product is required', color: 'red' });
      return;
    }
    if (!form.version.trim()) {
      notifications.show({ title: 'Validation', message: 'Version is required', color: 'red' });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/items/boms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.product_name,
          product_id: form.product_id,
          version: form.version,
          is_active: form.is_active,
          notes: form.notes || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.errors?.[0]?.message ?? 'Save failed');
      }
      const data = await res.json();
      notifications.show({ title: 'Created', message: 'BOM / Formula created', color: 'green' });
      router.push(`/ppic/bom/${data?.data?.id ?? ''}`);
    } catch (err) {
      notifications.show({ title: 'Error', message: err instanceof Error ? err.message : 'Failed', color: 'red' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Create BOM / Formula</Title>
        <Text c="dimmed" size="sm">
          Define material requirements for a product. Select the product (which becomes the formula name), set the version, then save.
        </Text>
      </div>
      <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
        The formula name is automatically set to the product name you select.
        After saving, you can add materials and quantities on the detail page.
      </Alert>

      <Paper p="md" radius="md" withBorder>
        <Stack gap="sm">
          <Group grow align="flex-start">
            {loading ? (
              <Input label="Product (Formula Name)" placeholder="Loading products..." disabled onChange={() => {}} required />
            ) : productChoices.length > 0 ? (
              <SelectDropdown
                label="Product (Formula Name)"
                placeholder="Select product — this becomes the formula name"
                choices={productChoices}
                value={form.product_id || null}
                onChange={handleProductChange}
                required
              />
            ) : (
              <Input label="Product (Formula Name)" value="" placeholder="No active products" disabled onChange={() => {}} required />
            )}
            <Input
              label="Version"
              placeholder="e.g. 1, 2.0"
              value={form.version}
              onChange={(v) => setForm((f) => ({ ...f, version: String(v ?? '') }))}
              required
            />
          </Group>

          <SelectDropdown
            label="Active"
            choices={[
              { text: 'Yes — this is the active formula', value: 'true' },
              { text: 'No — inactive/draft', value: 'false' },
            ]}
            value={form.is_active ? 'true' : 'false'}
            onChange={(v) => setForm((f) => ({ ...f, is_active: v === 'true' }))}
          />

          <Textarea
            label="Notes"
            placeholder="Formula notes (optional)..."
            value={form.notes}
            onChange={(v) => setForm((f) => ({ ...f, notes: String(v ?? '') }))}
          />
        </Stack>
      </Paper>

      <Group justify="flex-end">
        <Button variant="subtle" onClick={() => router.push('/ppic/bom')}>Cancel</Button>
        <Button onClick={handleSave} loading={saving}>Create Formula</Button>
      </Group>
    </Stack>
  );
}
