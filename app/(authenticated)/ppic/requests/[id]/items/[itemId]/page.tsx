'use client';

import { Stack, Title, Text } from '@mantine/core';
import { CollectionForm } from '@/components/ui/collection-form';
import { useRouter, useParams } from 'next/navigation';

export default function EditMaterialRequestItemPage() {
  const router = useRouter();
  const params = useParams();
  const requestId = params.id as string;
  const itemId = params.itemId as string;

  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Edit Request Item</Title>
        <Text c="dimmed" size="sm">Update requested quantity or add remarks.</Text>
      </div>
      <CollectionForm
        collection="material_request_items"
        mode="edit"
        id={itemId}
        onSuccess={() => router.push(`/ppic/requests/${requestId}`)}
        onCancel={() => router.push(`/ppic/requests/${requestId}`)}
      />
    </Stack>
  );
}
