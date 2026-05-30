'use client';

import { Stack, Title, Text } from '@mantine/core';
import { CollectionList } from '@/components/ui/collection-list';
import { useNameLookup } from '@/lib/hooks/useNameLookup';

export default function ManagerProductionPage() {
  const productNames = useNameLookup('products');

  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Production Orders</Title>
        <Text c="dimmed" size="sm">All production orders — read-only overview.</Text>
      </div>
      <CollectionList
        collection="production_orders"
        enableSearch
        enableFilter
        enableSort
        enableHeaderMenu
        enableResize
        fields={['order_number', 'product_id', 'planned_qty', 'unit', 'status', 'priority', 'due_date']}
        renderCell={(item, header) => {
          if (header.value === 'product_id') {
            const name = productNames.get(String(item.product_id ?? ''));
            return name ? <span style={{ fontSize: 'var(--mantine-font-size-sm)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, maxWidth: '100%', display: 'block' }}>{name}</span> : null;
          }
          return null;
        }}
      />
    </Stack>
  );
}
