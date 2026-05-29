'use client';

import { Stack, Title, Text } from '@mantine/core';
import { CollectionList } from '@/components/ui/collection-list';

export default function ExpectedIncomingPage() {
  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Expected Incoming Orders</Title>
        <Text c="dimmed" size="sm">PPIC raw material orders with status &quot;Ordered&quot; — prepare for receiving.</Text>
      </div>
      <CollectionList
        collection="raw_material_orders"
        enableSearch
        enableFilter
        enableSort
        filter={{ status: { _in: ['ordered', 'partially_received'] } }}
        fields={['order_number', 'material_id', 'supplier_id', 'ordered_qty', 'unit', 'expected_arrival_date', 'priority', 'status']}
      />
    </Stack>
  );
}
