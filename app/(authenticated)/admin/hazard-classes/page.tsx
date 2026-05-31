'use client';

import { Stack, Title, Text } from '@mantine/core';
import { CollectionList } from '@/components/ui/collection-list';
import { useRouter } from 'next/navigation';

export default function HazardClassesPage() {
  const router = useRouter();
  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Hazard Classes</Title>
        <Text c="dimmed" size="sm">Manage hazard classifications for storage compatibility.</Text>
        <Text c="dimmed" size="xs" mt={4}>💡 Right-click column header to sort, align, or hide. Drag the ⋮⋮ grip to reorder columns. Drag edges to resize.</Text>
      </div>
      <CollectionList
        collection="hazard_classes"
        enableSearch
        enableCreate
        enableDelete
        enableHeaderMenu
        enableResize
        enableReorder
        enableSort
        fields={['name', 'code', 'description', 'color']}
        onCreate={() => router.push('/admin/hazard-classes/create')}
        onItemClick={(item) => router.push(`/admin/hazard-classes/${item.id}`)}
      />
    </Stack>
  );
}
