'use client';

import { Stack, Title, Text } from '@mantine/core';
import { CollectionForm } from '@/components/ui/collection-form';
import { useRouter, useParams } from 'next/navigation';

export default function EditWarehouseLocationPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Edit Warehouse Location</Title>
        <Text c="dimmed" size="sm">Update location details.</Text>
      </div>
      <CollectionForm
        collection="warehouse_locations"
        mode="edit"
        id={id}
        onSuccess={() => router.push('/admin/warehouse-locations')}
        onCancel={() => router.push('/admin/warehouse-locations')}
      />
    </Stack>
  );
}
