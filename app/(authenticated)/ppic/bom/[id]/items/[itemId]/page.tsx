'use client';

import { Stack, Title, Text } from '@mantine/core';
import { CollectionForm } from '@/components/ui/collection-form';
import { useRouter, useParams } from 'next/navigation';

export default function EditBOMItemPage() {
  const router = useRouter();
  const params = useParams();
  const bomId = params.id as string;
  const itemId = params.itemId as string;

  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Edit Formula Material</Title>
        <Text c="dimmed" size="sm">Update the material quantity needed for this product formula.</Text>
      </div>
      <CollectionForm
        collection="bom_items"
        mode="edit"
        id={itemId}
        excludeFields={['scrap_percentage']}
        onSuccess={() => router.push(`/ppic/bom/${bomId}`)}
        onCancel={() => router.push(`/ppic/bom/${bomId}`)}
      />
    </Stack>
  );
}
