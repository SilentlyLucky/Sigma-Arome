'use client';

import { Stack, Text, Modal, Button, Group } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useState, useCallback } from 'react';
import { IconPlus } from '@tabler/icons-react';
import { CollectionList } from '@/components/ui/collection-list';
import { CollectionForm } from '@/components/ui/collection-form';

interface AnyItem {
  id?: string | number;
  [key: string]: unknown;
}

interface CrudTabProps {
  collection: string;
  description: string;
  fields: string[];
  filter?: Record<string, unknown>;
  createTitle: string;
  editTitle: string;
  /** Default values injected into the create form (e.g. parent FK). */
  createDefaults?: Record<string, unknown>;
  /** Fields to hide from the form. */
  excludeFields?: string[];
  renderCell?: (item: AnyItem, header: { value: string }) => React.ReactNode | null | undefined;
}

/**
 * Reusable CRUD tab — CollectionList with create/edit handled in a Modal via CollectionForm.
 * Used by the Warehouses, Zones, Racks and Bins tabs so the whole hierarchy is editable
 * from a single sidebar menu (no extra sidebar entries, no separate routes).
 */
export function CrudTab({
  collection,
  description,
  fields,
  filter,
  createTitle,
  editTitle,
  createDefaults,
  excludeFields,
  renderCell,
}: CrudTabProps) {
  const [opened, { open, close }] = useDisclosure(false);
  const [editId, setEditId] = useState<string | number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const openCreate = useCallback(() => {
    setEditId(null);
    open();
  }, [open]);

  const openEdit = useCallback(
    (item: AnyItem) => {
      if (item?.id == null) return;
      setEditId(item.id);
      open();
    },
    [open]
  );

  const handleSuccess = useCallback(() => {
    close();
    setRefreshKey((k) => k + 1);
  }, [close]);

  return (
    <Stack gap="md">
      <Text c="dimmed" size="sm">
        {description}
      </Text>

      <CollectionList
        key={refreshKey}
        collection={collection}
        filter={filter}
        fields={fields}
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
        renderCell={renderCell}
      />

      <Modal
        opened={opened}
        onClose={close}
        title={editId ? editTitle : createTitle}
        size="lg"
        closeOnClickOutside={false}
      >
        {opened && (
          <CollectionForm
            collection={collection}
            mode={editId ? 'edit' : 'create'}
            id={editId ?? undefined}
            defaultValues={editId ? undefined : createDefaults}
            excludeFields={excludeFields}
            onSuccess={handleSuccess}
            onCancel={close}
            onDelete={handleSuccess}
          />
        )}
      </Modal>

      {/* Secondary explicit create button for discoverability */}
      <Group>
        <Button variant="light" leftSection={<IconPlus size={16} />} onClick={openCreate}>
          New {createTitle.replace(/^Create\s+/i, '')}
        </Button>
      </Group>
    </Stack>
  );
}
