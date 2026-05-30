'use client';

import { Stack, Title, Text, Alert } from '@mantine/core';
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

      <Alert color="blue" variant="light">
        Hazard rules can be configured after creation by opening this location and editing
        <strong> Allowed Hazard Classes</strong>. Hazard classes are managed in{' '}
        <strong>Master Data → Hazard Classes</strong>.
      </Alert>

      <CollectionForm
        collection="warehouse_locations"
        mode="create"
        onSuccess={(item) => {
          if (item?.id) router.push(`/admin/warehouse-locations/${item.id}`);
          else router.push('/admin/warehouse-locations');
        }}
        onCancel={() => router.push('/admin/warehouse-locations')}
      />
    </Stack>
  );
}
