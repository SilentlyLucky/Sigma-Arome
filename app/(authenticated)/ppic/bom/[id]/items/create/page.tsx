'use client';

import { Stack, Title, Text, Alert } from '@mantine/core';
import { CollectionForm } from '@/components/ui/collection-form';
import { IconInfoCircle } from '@tabler/icons-react';
import { useRouter, useParams } from 'next/navigation';

export default function CreateBOMItemPage() {
  const router = useRouter();
  const params = useParams();
  const bomId = params.id as string;

  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Add Material to BOM</Title>
        <Text c="dimmed" size="sm">
          Select a raw material and specify the quantity needed per unit of finished product.
        </Text>
      </div>
      <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
        <strong>Qty per Unit</strong> = how much of this material is needed for 1 unit of product.
        <strong>Scrap %</strong> = expected waste during production (added on top of qty).
      </Alert>
      <CollectionForm
        collection="bom_items"
        mode="create"
        onSuccess={() => router.push(`/ppic/bom/${bomId}`)}
        onCancel={() => router.push(`/ppic/bom/${bomId}`)}
      />
    </Stack>
  );
}
