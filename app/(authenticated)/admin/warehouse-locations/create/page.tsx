'use client';

import { Stack, Title, Text } from '@mantine/core';
import { CollectionForm } from '@/components/ui/collection-form';
import { useRouter } from 'next/navigation';

export default function CreateWarehouseLocationPage() {
  const router = useRouter();

  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Create Warehouse Location</Title>
        <Text c="dimmed" size="sm">Add a new storage location.</Text>
      </div>
      <CollectionForm
        collection="warehouse_locations"
        mode="create"
        onSuccess={() => router.push('/admin/warehouse-locations')}
        onCancel={() => router.push('/admin/warehouse-locations')}
      />
    </Stack>
  );
}
