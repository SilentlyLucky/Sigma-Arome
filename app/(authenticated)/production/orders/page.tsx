'use client';

import { Stack, Title, Text } from '@mantine/core';
import { CollectionList } from '@/components/ui/collection-list';
import { useRouter } from 'next/navigation';
import { useNameLookup } from '@/lib/hooks/useNameLookup';

export default function ProductionOrdersPage() {
  const router = useRouter();
  const productNames = useNameLookup('products');

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
