'use client';

import { Stack, Title, Text } from '@mantine/core';
import { CollectionForm } from '@/components/ui/collection-form';
import { useRouter } from 'next/navigation';

export default function CreateHazardClassPage() {
  const router = useRouter();

  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Create Hazard Class</Title>
        <Text c="dimmed" size="sm">Define a new hazard classification.</Text>
      </div>
      <CollectionForm
        collection="hazard_classes"
        mode="create"
        excludeFields={['unsuitable_with']}
        onSuccess={() => router.push('/admin/hazard-classes')}
        onCancel={() => router.push('/admin/hazard-classes')}
      />
    </Stack>
  );
}
