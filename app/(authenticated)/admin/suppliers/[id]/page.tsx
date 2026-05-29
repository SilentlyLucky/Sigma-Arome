'use client';

import { Stack, Title, Text } from '@mantine/core';
import { CollectionForm } from '@/components/ui/collection-form';
import { useRouter, useParams } from 'next/navigation';

export default function EditSupplierPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Edit Supplier</Title>
        <Text c="dimmed" size="sm">Update supplier information.</Text>
      </div>
      <CollectionForm
        collection="suppliers"
        mode="edit"
        id={id}
        onSuccess={() => router.push('/admin/suppliers')}
        onCancel={() => router.push('/admin/suppliers')}
      />
    </Stack>
  );
}
