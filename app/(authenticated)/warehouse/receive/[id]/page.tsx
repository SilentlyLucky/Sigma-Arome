'use client';

import { Stack, Title, Text } from '@mantine/core';
import { CollectionForm } from '@/components/ui/collection-form';
import { useRouter, useParams } from 'next/navigation';

export default function ReceiptDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Receipt Detail</Title>
        <Text c="dimmed" size="sm">View receiving record details.</Text>
      </div>
      <CollectionForm collection="raw_material_receipts" mode="edit" id={id as string} onSuccess={() => router.push('/warehouse/receive')} onCancel={() => router.push('/warehouse/receive')} />
    </Stack>
  );
}
