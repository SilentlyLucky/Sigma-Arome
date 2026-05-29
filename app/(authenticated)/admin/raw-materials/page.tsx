'use client';

import { Stack, Title, Text } from '@mantine/core';
import { CollectionList } from '@/components/ui/collection-list';
import { useRouter } from 'next/navigation';

export default function RawMaterialsPage() {
  const router = useRouter();
  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Raw Materials</Title>
        <Text c="dimmed" size="sm">Manage raw material master data with storage and hazard requirements.</Text>
        <Text c="dimmed" size="xs" mt={4}>💡 Right-click column header to sort, align, or hide. Drag the ⋮⋮ grip to reorder columns. Drag edges to resize.</Text>
      </div>
      <CollectionList
        collection="raw_materials"
        enableSearch
        enableFilter
        enableCreate
        enableDelete
        enableHeaderMenu
        enableResize
        enableReorder
        enableSort
        fields={['name', 'code', 'category', 'unit', 'shelf_life_days', 'status']}
        onCreate={() => router.push('/admin/raw-materials/create')}
        onItemClick={(item) => router.push(`/admin/raw-materials/${item.id}`)}
      />
    </Stack>
  );
}
