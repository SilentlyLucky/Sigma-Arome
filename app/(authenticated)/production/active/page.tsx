'use client';

import { Stack, Title, Text } from '@mantine/core';
import { CollectionList } from '@/components/ui/collection-list';
import { useRouter } from 'next/navigation';
import { useNameLookup } from '@/lib/hooks/useNameLookup';

export default function ActiveProductionPage() {
  const router = useRouter();
  const productNames = useNameLookup('products');

  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Active Production</Title>
        <Text c="dimmed" size="sm">Production orders currently in progress.</Text>
      </div>
      <CollectionList
        collection="production_orders"
        enableSearch
        enableSort
        filter={{ status: { _eq: 'in_progress' } }}
        fields={['order_number', 'product_id', 'planned_qty', 'unit', 'priority', 'planned_start_date']}
        onItemClick={(item) => router.push(`/production/orders/${item.id}`)}
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
