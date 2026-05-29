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
        <Text c="dimmed" size="sm">All production orders assigned to Production. Click to view details and execute.</Text>
      </div>
      <CollectionList
        collection="production_orders"
        enableSearch
        enableFilter
        enableSort
        enableHeaderMenu
        enableResize
        filter={{ status: { _in: ['ready', 'released', 'in_progress'] } }}
        fields={['order_number', 'product_id', 'planned_qty', 'unit', 'status', 'priority', 'due_date']}
        onItemClick={(item) => router.push(`/production/orders/${item.id}`)}
      />
    </Stack>
  );
}
