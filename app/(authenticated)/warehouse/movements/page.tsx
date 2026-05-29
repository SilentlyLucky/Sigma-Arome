'use client';

import { Stack, Title, Text } from '@mantine/core';
import { CollectionList } from '@/components/ui/collection-list';

export default function MovementLogPage() {
  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Inventory Movement Log</Title>
        <Text c="dimmed" size="sm">History of all physical material movements — receiving, putaway, issue, and transfers.</Text>
      </div>
      <CollectionList
        collection="inventory_movements"
        enableSearch
        enableFilter
        enableSort
        enableHeaderMenu
        enableResize
        fields={['batch_id', 'movement_type', 'from_location_id', 'to_location_id', 'qty', 'date_created']}
      />
    </Stack>
  );
}
