'use client';

import { Stack, Title, Text } from '@mantine/core';
import { CollectionList } from '@/components/ui/collection-list';
import { useRouter } from 'next/navigation';

export default function BOMListPage() {
  const router = useRouter();
  return (
    <Stack gap="md">
      <div>
        <Title order={2}>BOM / Formula</Title>
        <Text c="dimmed" size="sm">
          Bill of Materials defines material requirements per unit of finished product.
          Used to auto-calculate material needs for Production Orders.
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
        fields={['name', 'version', 'is_active']}
        onCreate={() => router.push('/ppic/bom/create')}
        onItemClick={(item) => router.push(`/ppic/bom/${item.id}`)}
      />
    </Stack>
  );
}
