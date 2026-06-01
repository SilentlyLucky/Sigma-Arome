'use client';

import { Group, Stack, Text, Title } from '@mantine/core';
import { CollectionList } from '@/components/ui/collection-list';
import { useRouter } from 'next/navigation';

export default function ProductsPage() {
  const router = useRouter();
  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-end" gap="md">
        <div>
          <Title order={2}>Finished Products</Title>
          <Text c="dimmed" size="sm">Manage finished product master data.</Text>
        </div>
        <Text c="dimmed" size="xs" ta="right" maw={580} style={{ lineHeight: 1.45 }}>
          💡 Right-click column header to sort, align, or hide. Drag the ⋮⋮ grip to reorder columns. Drag edges to resize.
        </Text>
      </Group>
      <CollectionList
        collection="products"
        enableSearch
        enableFilter
        enableCreate
        enableDelete
        enableHeaderMenu
        enableResize
        enableReorder
        enableSort
        fields={['name', 'code', 'category', 'unit', 'status']}
        onCreate={() => router.push('/admin/products/create')}
        onItemClick={(item) => router.push(`/admin/products/${item.id}`)}
      />
    </Stack>
  );
}
