'use client';

import { Stack, Title, Text } from '@mantine/core';
import { CollectionForm } from '@/components/ui/collection-form';
import { useRouter, useParams } from 'next/navigation';

export default function EditStorageRulePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Edit Storage Rule</Title>
        <Text c="dimmed" size="sm">Update storage rule configuration.</Text>
      </div>
      <CollectionForm
        collection="storage_rules"
        mode="edit"
        id={id}
        onSuccess={() => router.push('/admin/storage-rules')}
        onCancel={() => router.push('/admin/storage-rules')}
      />
    </Stack>
  );
}
