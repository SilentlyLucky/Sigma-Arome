'use client';

import { Stack, Title, Text } from '@mantine/core';
import { CollectionForm } from '@/components/ui/collection-form';
import { useRouter } from 'next/navigation';

export default function CreateRawMaterialPage() {
  const router = useRouter();

  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Create Raw Material</Title>
        <Text c="dimmed" size="sm">Add a new raw material to the system.</Text>
      </div>
      <CollectionForm
        collection="raw_materials"
        mode="create"
        onSuccess={() => router.push('/admin/raw-materials')}
        onCancel={() => router.push('/admin/raw-materials')}
      />
    </Stack>
  );
}
