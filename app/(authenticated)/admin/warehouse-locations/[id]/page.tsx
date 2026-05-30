'use client';

import { Stack, Title, Text, Paper, Group, Button, Loader, Alert } from '@mantine/core';
import { CollectionForm } from '@/components/ui/collection-form';
import { SelectMultipleDropdown } from '@/components/ui/select-multiple-dropdown';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';

interface HazardClass {
  id: string;
  name: string;
  code: string | null;
}

export default function EditWarehouseLocationPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [hazards, setHazards] = useState<HazardClass[]>([]);
  const [allowed, setAllowed] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [hRes, lRes] = await Promise.all([
        fetch('/api/items/hazard_classes?fields=id,name,code&limit=100', { cache: 'no-store' }),
        fetch(`/api/items/warehouse_locations/${id}?fields=allowed_hazard_classes`, { cache: 'no-store' }),
      ]);
      const hJson = await hRes.json();
      const lJson = await lRes.json();
      setHazards(hJson.data ?? []);
      const raw = lJson?.data?.allowed_hazard_classes;
      setAllowed(Array.isArray(raw) ? raw.map(String) : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const saveHazards = async () => {
    setSaving(true);
    setSavedMsg(null);
    setError(null);
    try {
      const res = await fetch(`/api/items/warehouse_locations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allowed_hazard_classes: allowed }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      setSavedMsg('Allowed hazard classes updated.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const choices = hazards.map((h) => ({
    text: h.code ? `${h.name} (${h.code})` : h.name,
    value: h.id,
  }));

  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Edit Warehouse Location</Title>
        <Text c="dimmed" size="sm">Update location details and storage rules.</Text>
      </div>

      <CollectionForm
        collection="warehouse_locations"
        mode="edit"
        id={id}
        onSuccess={() => router.push('/admin/warehouse-locations')}
        onCancel={() => router.push('/admin/warehouse-locations')}
      />

      <Paper p="md" withBorder>
        <Stack gap="sm">
          <div>
            <Text fw={600}>Allowed Hazard Classes</Text>
            <Text c="dimmed" size="xs">
              Materials with these hazard classifications can be stored here. Edit the hazard
              classes and their co-location rules in <strong>Master Data → Hazard Classes</strong>.
            </Text>
          </div>

          {loading ? (
            <Loader size="sm" />
          ) : (
            <SelectMultipleDropdown
              label="Permitted hazards"
              placeholder="Select one or more hazard classes"
              choices={choices}
              value={allowed}
              onChange={(v) => setAllowed((v ?? []).map(String))}
              clearable
              searchable
            />
          )}

          {error && <Alert color="red">{error}</Alert>}
          {savedMsg && <Alert color="green">{savedMsg}</Alert>}

          <Group justify="flex-end">
            <Button onClick={saveHazards} loading={saving} disabled={loading}>
              Save Hazard Rules
            </Button>
          </Group>
        </Stack>
      </Paper>
    </Stack>
  );
}
