'use client';

import { Group, Stack, Text, Title } from '@mantine/core';
import { CollectionList } from '@/components/ui/collection-list';
import { useRouter } from 'next/navigation';

export default function HazardClassesPage() {
  const router = useRouter();
  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-end" gap="md">
        <div>
          <Title order={2}>Hazard Classes</Title>
          <Text c="dimmed" size="sm">Manage hazard classifications for storage compatibility.</Text>
        </div>
        <Text c="dimmed" size="xs" ta="right" maw={580} style={{ lineHeight: 1.45 }}>
          💡 Right-click column header to sort, align, or hide. Drag the ⋮⋮ grip to reorder columns. Drag edges to resize.
        </Text>
      </Group>
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
