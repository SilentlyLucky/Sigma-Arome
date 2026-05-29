'use client';

import { Stack, Title, Text } from '@mantine/core';
import { CollectionForm } from '@/components/ui/collection-form';
import { useRouter } from 'next/navigation';

export default function CreateStorageRulePage() {
  const router = useRouter();

  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Create Storage Rule</Title>
        <Text c="dimmed" size="sm">Define a new storage slotting rule.</Text>
      </div>
      <CollectionForm
        collection="storage_rules"
        mode="create"
        onSuccess={() => router.push('/admin/storage-rules')}
        onCancel={() => router.push('/admin/storage-rules')}
      />
    </Stack>
  );
}
