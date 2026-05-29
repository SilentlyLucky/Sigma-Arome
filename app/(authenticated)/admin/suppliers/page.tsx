'use client';

import { Stack, Title, Text } from '@mantine/core';
import { CollectionList } from '@/components/ui/collection-list';
import { useRouter } from 'next/navigation';

export default function SuppliersPage() {
  const router = useRouter();
  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Suppliers</Title>
        <Text c="dimmed" size="sm">Manage supplier master data for raw material ordering.</Text>
        <Text c="dimmed" size="xs" mt={4}>💡 Right-click column header to sort, align, or hide. Drag the ⋮⋮ grip to reorder columns. Drag edges to resize.</Text>
      </div>
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
