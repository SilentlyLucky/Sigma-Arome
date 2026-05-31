'use client';

import { Stack, Title, Text } from '@mantine/core';
import { CollectionList } from '@/components/ui/collection-list';
import { useRouter } from 'next/navigation';
import { useNameLookup } from '@/lib/hooks/useNameLookup';

export default function BOMListPage() {
  const router = useRouter();
  const productNames = useNameLookup('products');

  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Product Formulas</Title>
        <Text c="dimmed" size="sm">
          Define which raw materials are needed to make each product.
        </Text>
      </div>
      <CollectionList
        collection="boms"
        enableSearch
        enableFilter
        enableCreate
        enableSort
        enableHeaderMenu
        enableResize
        fields={['product_id', 'version', 'is_active']}
        onCreate={() => router.push('/ppic/bom/create')}
        onItemClick={(item) => router.push(`/ppic/bom/${item.id}`)}
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
