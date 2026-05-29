'use client';

import { Stack, Title, Text } from '@mantine/core';
import { CollectionForm } from '@/components/ui/collection-form';
import { useRouter, useParams } from 'next/navigation';

export default function CreateMaterialRequestItemPage() {
  const router = useRouter();
  const params = useParams();
  const requestId = params.id as string;

  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Add Material to Request</Title>
        <Text c="dimmed" size="sm">Select a raw material and specify the quantity needed for production.</Text>
      </div>
      <CollectionForm
        collection="material_request_items"
        mode="create"
        onSuccess={() => router.push(`/ppic/requests/${requestId}`)}
        onCancel={() => router.push(`/ppic/requests/${requestId}`)}
      />
    </Stack>
  );
}
