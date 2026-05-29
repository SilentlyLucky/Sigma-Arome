'use client';

import { Stack, Title, Text } from '@mantine/core';
import { CollectionForm } from '@/components/ui/collection-form';
import { useRouter } from 'next/navigation';

export default function CreateSupplierPage() {
  const router = useRouter();

  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Create Supplier</Title>
        <Text c="dimmed" size="sm">Add a new supplier to the system.</Text>
      </div>
      <CollectionForm
        collection="suppliers"
        mode="create"
        onSuccess={() => router.push('/admin/suppliers')}
        onCancel={() => router.push('/admin/suppliers')}
      />
    </Stack>
  );
}
