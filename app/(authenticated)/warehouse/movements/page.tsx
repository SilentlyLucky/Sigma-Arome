'use client';

import { Stack, Title, Text } from '@mantine/core';
import { CollectionList } from '@/components/ui/collection-list';

export default function MovementLogPage() {
  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Inventory Movement History</Title>
        <Text c="dimmed" size="sm">
          A history of material movement across the factory, including receiving, storage,
          production release, and transfers.
        </Text>
      </div>
      <CollectionList
        collection="inventory_movements"
        enableSearch
        enableFilter
        enableSort
        enableHeaderMenu
        enableResize
        fields={['batch_id', 'movement_type', 'from_location_id', 'to_location_id', 'qty', 'moved_by', 'date_created', 'notes']}
        defaultSort={{ by: 'date_created', desc: true }}
      />
    </Stack>
  );
}
