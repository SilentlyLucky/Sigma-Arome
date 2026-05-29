'use client';

import { Stack, Title, Text } from '@mantine/core';
import { CollectionList } from '@/components/ui/collection-list';
import { useNameLookup } from '@/lib/hooks/useNameLookup';

export default function CompletedProductionPage() {
  const productNames = useNameLookup('products');

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
        renderCell={(item, header) => {
          if (header.value === 'product_id') {
            const name = productNames.get(String(item.product_id ?? ''));
            return name ? <span style={{ fontSize: 'var(--mantine-font-size-sm)' }}>{name}</span> : null;
          }
          return null;
        }}
      />
    </Stack>
  );
}
