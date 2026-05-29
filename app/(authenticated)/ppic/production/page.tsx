'use client';

import { Stack, Title, Text } from '@mantine/core';
import { CollectionList } from '@/components/ui/collection-list';
import { useRouter } from 'next/navigation';

export default function ProductionOrdersPage() {
  const router = useRouter();
  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Production Orders</Title>
        <Text c="dimmed" size="sm">Plan production runs and track material readiness status.</Text>
        <Text c="dimmed" size="xs" mt={4}>💡 Right-click column header to sort, align, or hide. Drag the ⋮⋮ grip to reorder columns.</Text>
      </div>
      <CollectionList
        collection="production_orders"
        enableSearch
        enableFilter
        enableCreate
        enableSort
        enableResize
        enableReorder
        enableHeaderMenu
        fields={['order_number', 'product_id', 'planned_qty', 'unit', 'status', 'priority', 'planned_start_date']}
        onCreate={() => router.push('/ppic/production/create')}
        onItemClick={(item) => router.push(`/ppic/production/${item.id}`)}
      />
    </Stack>
  );
}
