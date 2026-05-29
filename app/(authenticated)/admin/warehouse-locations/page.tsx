'use client';

import { Stack, Title, Text } from '@mantine/core';
import { CollectionList } from '@/components/ui/collection-list';
import { useRouter } from 'next/navigation';

export default function WarehouseLocationsPage() {
  const router = useRouter();
  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Warehouse Locations</Title>
        <Text c="dimmed" size="sm">Manage warehouse zones, racks, and bins.</Text>
        <Text c="dimmed" size="xs" mt={4}>💡 Right-click column header to sort, align, or hide. Drag the ⋮⋮ grip to reorder columns. Drag edges to resize.</Text>
      </div>
      <CollectionList
        collection="warehouse_locations"
        enableSearch
        enableFilter
        enableCreate
        enableDelete
        enableHeaderMenu
        enableResize
        enableReorder
        enableSort
        fields={['location_code', 'zone', 'rack', 'bin', 'location_type', 'capacity', 'status']}
        onCreate={() => router.push('/admin/warehouse-locations/create')}
        onItemClick={(item) => router.push(`/admin/warehouse-locations/${item.id}`)}
      />
    </Stack>
  );
}
