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
  unsuitable_with: string[] | null;
}

export default function EditHazardClassPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [hazards, setHazards] = useState<HazardClass[]>([]);
  const [unsuitable, setUnsuitable] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const loadHazards = useCallback(async () => {
    try {
      const res = await fetch('/api/items/hazard_classes?fields=id,name,code,unsuitable_with&limit=100', {
        cache: 'no-store',
      });
      const json = await res.json();
      const list: HazardClass[] = json.data ?? [];
      setHazards(list);
      const me = list.find((h) => h.id === id);
      setUnsuitable(Array.isArray(me?.unsuitable_with) ? (me!.unsuitable_with as string[]) : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load hazards');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadHazards();
  }, [loadHazards]);

  const saveUnsuitable = async () => {
    setSaving(true);
    setSavedMsg(null);
    setError(null);
    try {
      const res = await fetch(`/api/items/hazard_classes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unsuitable_with: unsuitable }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      setSavedMsg('Co-location rules updated.');
      await loadHazards();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const otherChoices = hazards
    .filter((h) => h.id !== id)
    .map((h) => ({
      text: h.code ? `${h.name} (${h.code})` : h.name,
      value: h.id,
    }));

  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Edit Hazard Class</Title>
        <Text c="dimmed" size="sm">Update hazard class details and co-location rules.</Text>
      </div>

      <CollectionForm
        collection="hazard_classes"
        mode="edit"
        id={id}
        onSuccess={() => router.push('/admin/hazard-classes')}
        onCancel={() => router.push('/admin/hazard-classes')}
      />

      <Paper p="md" withBorder>
        <Stack gap="sm">
          <div>
            <Text fw={600}>Unsuitable With (Co-location Rules)</Text>
            <Text c="dimmed" size="xs">
              Hazard classes that cannot be stored next to this one. The slotting engine
              will block any location currently holding a material from one of these
              classes.
            </Text>
          </div>

          {loading ? (
            <Loader size="sm" />
          ) : (
            <SelectMultipleDropdown
              label="Cannot be co-located with"
              placeholder="Select one or more hazard classes"
              choices={otherChoices}
              value={unsuitable}
              onChange={(v) => setUnsuitable((v ?? []).map(String))}
              clearable
              searchable
            />
          )}

          {error && <Alert color="red">{error}</Alert>}
          {savedMsg && <Alert color="green">{savedMsg}</Alert>}

          <Group justify="flex-end">
            <Button onClick={saveUnsuitable} loading={saving} disabled={loading}>
              Save Co-location Rules
            </Button>
          </Group>
        </Stack>
      </Paper>
    </Stack>
  );
}
