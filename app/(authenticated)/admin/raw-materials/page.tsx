'use client';

import { Group, Stack, Text, Title } from '@mantine/core';
import { CollectionList } from '@/components/ui/collection-list';
import { useRouter } from 'next/navigation';

export default function RawMaterialsPage() {
  const router = useRouter();
  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-end" gap="md">
        <div>
          <Title order={2}>Raw Materials</Title>
          <Text c="dimmed" size="sm">Manage raw material master data with storage and hazard requirements.</Text>
        </div>
        <Text c="dimmed" size="xs" ta="right" maw={580} style={{ lineHeight: 1.45 }}>
          💡 Right-click column header to sort, align, or hide. Drag the ⋮⋮ grip to reorder columns. Drag edges to resize.
        </Text>
      </Group>
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
