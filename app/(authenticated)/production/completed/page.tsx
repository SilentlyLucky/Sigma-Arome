'use client';

import { Stack, Title, Text } from '@mantine/core';
import { CollectionList } from '@/components/ui/collection-list';

export default function CompletedProductionPage() {
  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Completed Production</Title>
        <Text c="dimmed" size="sm">Production orders that have been completed.</Text>
      </div>
      <CollectionList
        collection="production_orders"
        enableSearch
        enableSort
        filter={{ status: { _eq: 'completed' } }}
        fields={['order_number', 'product_id', 'planned_qty', 'unit', 'priority', 'due_date']}
      />
    </Stack>
  );
}
