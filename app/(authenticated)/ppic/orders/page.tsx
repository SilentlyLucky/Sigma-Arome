'use client';

import { Stack, Title, Text } from '@mantine/core';
import { CollectionList } from '@/components/ui/collection-list';
import { useRouter } from 'next/navigation';

export default function RawMaterialOrdersPage() {
  const router = useRouter();
  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Raw Material Orders</Title>
        <Text c="dimmed" size="sm">Create and track raw material orders for internal production needs.</Text>
        <Text c="dimmed" size="xs" mt={4}>💡 Right-click column header to sort, align, or hide. Drag the ⋮⋮ grip to reorder columns.</Text>
      </div>
      <CollectionList
        collection="raw_material_orders"
        enableSearch
        enableFilter
        enableCreate
        enableSort
        enableResize
        enableReorder
        enableHeaderMenu
        fields={['order_number', 'material_id', 'supplier_id', 'ordered_qty', 'unit', 'expected_arrival_date', 'priority', 'status']}
        onCreate={() => router.push('/ppic/orders/create')}
        onItemClick={(item) => router.push(`/ppic/orders/${item.id}`)}
      />
    </Stack>
  );
}
