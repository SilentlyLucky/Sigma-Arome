'use client';

import { Stack, Title, Text } from '@mantine/core';
import { CollectionList } from '@/components/ui/collection-list';
import { useRouter } from 'next/navigation';

export default function StorageRulesPage() {
  const router = useRouter();
  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Storage Rules</Title>
        <Text c="dimmed" size="sm">Define storage slotting rules — temperature, hazard compatibility, and location type requirements.</Text>
        <Text c="dimmed" size="xs" mt={4}>💡 Right-click column header to sort, align, or hide. Drag the ⋮⋮ grip to reorder columns. Drag edges to resize.</Text>
      </div>
      <CollectionList
        collection="storage_rules"
        enableSearch
        enableFilter
        enableCreate
        enableDelete
        enableHeaderMenu
        enableResize
        enableReorder
        enableSort
        fields={['material_id', 'hazard_class_id', 'temp_min', 'temp_max', 'allowed_location_type']}
        onCreate={() => router.push('/admin/storage-rules/create')}
        onItemClick={(item) => router.push(`/admin/storage-rules/${item.id}`)}
      />
    </Stack>
  );
}
