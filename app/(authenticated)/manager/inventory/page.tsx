'use client';

import { Stack, Title, Text } from '@mantine/core';
import { CollectionList } from '@/components/ui/collection-list';
import { useNameLookup } from '@/lib/hooks/useNameLookup';

export default function ManagerInventoryPage() {
  const materialNames = useNameLookup('raw_materials');

  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Inventory — All Batches</Title>
        <Text c="dimmed" size="sm">All batches across the factory — raw material and finished product.</Text>
      </div>
      <CollectionList
        collection="batches"
        enableSearch
        enableFilter
        enableSort
        enableHeaderMenu
        enableResize
        fields={['batch_number', 'material_id', 'batch_type', 'qty', 'unit', 'status', 'current_location_id', 'expiry_date']}
        renderCell={(item, header) => {
          if (header.value === 'material_id') {
            const name = materialNames.get(String(item.material_id ?? ''));
            return name ? <span style={{ fontSize: 'var(--mantine-font-size-sm)' }}>{name}</span> : null;
          }
          return null;
        }}
      />
    </Stack>
  );
}
