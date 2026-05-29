'use client';

import { Stack, Title, Text, Alert } from '@mantine/core';
import { CollectionForm } from '@/components/ui/collection-form';
import { IconInfoCircle } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';

export default function CreateRawMaterialOrderPage() {
  const router = useRouter();

  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Create Raw Material Order</Title>
        <Text c="dimmed" size="sm">
          Order raw materials from suppliers for internal production needs.
        </Text>
      </div>

      <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
        Select a <strong>Material</strong> and optionally a <strong>Supplier</strong> from the dropdowns.
        Order number and status are managed by the system.
      </Alert>

      <CollectionForm
        collection="raw_material_orders"
        mode="create"
        onSuccess={() => router.push('/ppic/orders')}
        onCancel={() => router.push('/ppic/orders')}
      />
    </Stack>
  );
}
