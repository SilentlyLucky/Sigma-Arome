'use client';

import { Stack, Title, Text } from '@mantine/core';
import { CollectionForm } from '@/components/ui/collection-form';
import { useRouter, useParams } from 'next/navigation';

export default function EditHazardClassPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Edit Hazard Class</Title>
        <Text c="dimmed" size="sm">Update hazard class details.</Text>
      </div>
      <CollectionForm
        collection="hazard_classes"
        mode="edit"
        id={id}
        onSuccess={() => router.push('/admin/hazard-classes')}
        onCancel={() => router.push('/admin/hazard-classes')}
      />
    </Stack>
  );
}
