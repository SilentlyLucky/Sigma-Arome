'use client';

import { Stack, Text, Modal, Button, Group, Paper, Loader, Alert, Badge } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useState, useCallback, useEffect } from 'react';
import { IconPlus, IconInfoCircle } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { CollectionList } from '@/components/ui/collection-list';
import { CollectionForm } from '@/components/ui/collection-form';
import { SelectMultipleDropdown } from '@/components/ui/select-multiple-dropdown';

interface AnyItem {
  id?: string | number;
  [key: string]: unknown;
}

interface HazardClass {
  id: string;
  name: string;
  code: string | null;
}

/**
 * Bins tab — Bins are the actual inventory locations (warehouse_locations).
 * Inventory always lives at the Bin level. current_occupancy is computed
 * automatically from the batches stored here (never edited by hand).
 *
 * The form is the standard CollectionForm plus an "Allowed Hazard Classes"
 * multi-select (JSON column edited via SelectMultipleDropdown of hazard IDs).
 */
export function BinsTab() {
  const [opened, { open, close }] = useDisclosure(false);
  const [editId, setEditId] = useState<string | number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Hazard multi-select state
  const [hazards, setHazards] = useState<HazardClass[]>([]);
  const [hazardsLoading, setHazardsLoading] = useState(true);
  const [allowed, setAllowed] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/items/hazard_classes?fields[]=id&fields[]=name&fields[]=code&limit=100', {
      cache: 'no-store',
    })
      .then((r) => r.json())
      .then((d) => setHazards(d?.data ?? []))
      .finally(() => setHazardsLoading(false));
  }, []);

  const loadAllowed = useCallback(async (id: string | number) => {
    try {
      const res = await fetch(
        `/api/items/warehouse_locations/${id}?fields[]=allowed_hazard_classes`,
        { cache: 'no-store' }
      );
      const json = await res.json();
      const raw = json?.data?.allowed_hazard_classes;
      setAllowed(Array.isArray(raw) ? raw.map(String) : []);
    } catch {
      setAllowed([]);
    }
  }, []);

  const openCreate = useCallback(() => {
    setEditId(null);
    setAllowed([]);
    open();
  }, [open]);

  const openEdit = useCallback(
    (item: AnyItem) => {
      if (item?.id == null) return;
      setEditId(item.id);
      setAllowed([]);
      loadAllowed(item.id);
      open();
    },
    [open, loadAllowed]
  );

  const handleSuccess = useCallback(
    async (data?: Record<string, unknown>) => {
      // Persist allowed_hazard_classes after the base record is saved.
      const id = editId ?? (data?.id as string | undefined);
      if (id) {
        try {
          await fetch(`/api/items/warehouse_locations/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ allowed_hazard_classes: allowed }),
          });
        } catch {
          notifications.show({
            title: 'Warning',
            message: 'Bin saved but hazard rules could not be updated.',
            color: 'orange',
          });
        }
      }
      close();
      setRefreshKey((k) => k + 1);
    },
    [close, editId, allowed]
  );

  const choices = hazards.map((h) => ({
    text: h.code ? `${h.name} (${h.code})` : h.name,
    value: h.id,
  }));

  return (
    <Stack gap="md">
      <Text c="dimmed" size="sm">
        Bins are the actual storage locations — inventory always lives at the Bin level. Occupancy
        is computed automatically from the batches stored in each bin and is never edited manually.
      </Text>

      <CollectionList
        key={refreshKey}
        collection="warehouse_locations"
        fields={[
          'location_code',
          'rack_id',
          'zone',
          'capacity_kg',
          'current_occupancy_kg',
          'capacity_pcs',
          'temperature_min',
          'temperature_max',
          'status',
        ]}
        enableSearch
        enableFilter
        enableSort
        enableCreate
        enableDelete
        enableHeaderMenu
        enableResize
        onCreate={openCreate}
        onItemClick={openEdit}
        onDeleteSuccess={() => setRefreshKey((k) => k + 1)}
      />

      <Group>
        <Button variant="light" leftSection={<IconPlus size={16} />} onClick={openCreate}>
          New Bin
        </Button>
      </Group>

      <Modal
        opened={opened}
        onClose={close}
        title={editId ? 'Edit Bin' : 'Create Bin'}
        size="lg"
        closeOnClickOutside={false}
      >
        {opened && (
          <Stack gap="md">
            <CollectionForm
              collection="warehouse_locations"
              mode={editId ? 'edit' : 'create'}
              id={editId ?? undefined}
              excludeFields={[
                'rack',
                'bin',
                'location_type',
                'temp_zone',
                'capacity',
                'current_occupancy',
                'temperature_min_c',
                'temperature_max_c',
                'current_material_name',
                'occupying_batch_ids',
                'allowed_hazard_classes',
              ]}
              onSuccess={handleSuccess}
              onCancel={close}
            />

            <Paper p="md" withBorder>
              <Stack gap="sm">
                <div>
                  <Text fw={600}>Allowed Hazard Classes</Text>
                  <Text c="dimmed" size="xs">
                    Materials with these hazard classifications may be stored in this bin. Manage
                    hazard classes and their co-location rules in{' '}
                    <strong>Master Data → Hazard Classes</strong>.
                  </Text>
                </div>

                {hazardsLoading ? (
                  <Loader size="sm" />
                ) : choices.length > 0 ? (
                  <SelectMultipleDropdown
                    label="Permitted hazards"
                    placeholder="Select one or more hazard classes"
                    choices={choices}
                    value={allowed}
                    onChange={(v) => setAllowed((v ?? []).map(String))}
                    clearable
                    searchable
                  />
                ) : (
                  <Alert color="gray" variant="light" icon={<IconInfoCircle size={14} />}>
                    No hazard classes defined yet.
                  </Alert>
                )}

                <Text size="xs" c="dimmed">
                  Hazard rules are saved together with the bin.
                </Text>
              </Stack>
            </Paper>
          </Stack>
        )}
      </Modal>
    </Stack>
  );
}
