'use client';

import { Stack, Title, Text } from '@mantine/core';
import { CollectionForm } from '@/components/ui/collection-form';
import { useRouter, useParams } from 'next/navigation';

export default function EditRawMaterialPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Edit Raw Material</Title>
        <Text c="dimmed" size="sm">Update raw material information.</Text>
      </div>
      <CollectionForm
        collection="raw_materials"
        mode="edit"
        id={id}
        onSuccess={() => router.push('/admin/raw-materials')}
        onCancel={() => router.push('/admin/raw-materials')}
      />
    </Stack>
  );
}
