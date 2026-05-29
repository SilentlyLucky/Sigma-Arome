'use client';

import { Stack, Title, Text } from '@mantine/core';
import { CollectionForm } from '@/components/ui/collection-form';
import { useRouter, useParams } from 'next/navigation';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Edit Product</Title>
        <Text c="dimmed" size="sm">Update product information.</Text>
      </div>
      <CollectionForm
        collection="products"
        mode="edit"
        id={id}
        onSuccess={() => router.push('/admin/products')}
        onCancel={() => router.push('/admin/products')}
      />
    </Stack>
  );
}
