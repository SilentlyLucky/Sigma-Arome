'use client';

import { Group, Stack, Text, Title } from '@mantine/core';
import { CollectionList } from '@/components/ui/collection-list';
import { useRouter } from 'next/navigation';

export default function SuppliersPage() {
  const router = useRouter();
  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-end" gap="md">
        <div>
          <Title order={2}>Suppliers</Title>
          <Text c="dimmed" size="sm">Manage supplier master data for raw material ordering.</Text>
        </div>
        <Text c="dimmed" size="xs" ta="right" maw={580} style={{ lineHeight: 1.45 }}>
          💡 Right-click column header to sort, align, or hide. Drag the ⋮⋮ grip to reorder columns. Drag edges to resize.
        </Text>
      </Group>
      <CollectionList
        collection="suppliers"
        enableSearch
        enableFilter
        enableCreate
        enableDelete
        enableHeaderMenu
        enableResize
        enableReorder
        enableSort
        fields={['supplier_name', 'contact_person', 'email', 'phone', 'status']}
        onCreate={() => router.push('/admin/suppliers/create')}
        onItemClick={(item) => router.push(`/admin/suppliers/${item.id}`)}
      />
    </Stack>
  );
}
