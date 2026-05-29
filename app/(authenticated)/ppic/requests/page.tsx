'use client';

import { Stack, Title, Text } from '@mantine/core';
import { CollectionList } from '@/components/ui/collection-list';
import { useRouter } from 'next/navigation';

export default function MaterialRequestsPage() {
  const router = useRouter();
  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Material Requests</Title>
        <Text c="dimmed" size="sm">
          Request raw materials from Warehouse for production. Each request is linked to a Production Order
          and contains line items for each material needed.
        </Text>
      </div>
      <CollectionList
        collection="material_requests"
        enableSearch
        enableFilter
        enableCreate
        enableSort
        enableHeaderMenu
        enableResize
        fields={['request_number', 'production_order_id', 'needed_date', 'priority', 'status']}
        onCreate={() => router.push('/ppic/requests/create')}
        onItemClick={(item) => router.push(`/ppic/requests/${item.id}`)}
      />
    </Stack>
  );
}
