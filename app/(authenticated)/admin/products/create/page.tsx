'use client';

import { Stack, Title, Text } from '@mantine/core';
import { CollectionForm } from '@/components/ui/collection-form';
import { useRouter } from 'next/navigation';

export default function CreateProductPage() {
  const router = useRouter();

  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Create Product</Title>
        <Text c="dimmed" size="sm">Add a new finished product to the system.</Text>
      </div>
      <CollectionForm
        collection="products"
        mode="create"
        onSuccess={() => router.push('/admin/products')}
        onCancel={() => router.push('/admin/products')}
      />
    </Stack>
  );
}
