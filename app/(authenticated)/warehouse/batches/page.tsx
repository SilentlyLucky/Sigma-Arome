'use client';

import { Stack, Title, Text } from '@mantine/core';
import { CollectionList } from '@/components/ui/collection-list';
import { useRouter } from 'next/navigation';

export default function BatchesPage() {
  const router = useRouter();
  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Batches</Title>
        <Text c="dimmed" size="sm">All internal batches — raw material and finished product. Track status from QC Pending to Stored.</Text>
      </div>
      <CollectionList
        collection="batches"
        enableSearch
        enableFilter
        enableSort
        enableHeaderMenu
        enableResize
        fields={['batch_number', 'material_id', 'batch_type', 'qty', 'unit', 'status', 'current_location_id', 'expiry_date']}
        onItemClick={(item) => router.push(`/warehouse/batches/${item.id}`)}
      />
    </Stack>
  );
}
