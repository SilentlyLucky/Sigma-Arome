'use client';

import { Stack, Title, Text } from '@mantine/core';
import { CollectionForm } from '@/components/ui/collection-form';
import { useRouter, useParams } from 'next/navigation';

export default function EditQCTemplatePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Edit Quality Check Form</Title>
        <Text c="dimmed" size="sm">Update the checks and limits inspectors should use.</Text>
      </div>
      <CollectionForm
        collection="qc_templates"
        mode="edit"
        id={id}
        onSuccess={() => router.push('/admin/qc-templates')}
        onCancel={() => router.push('/admin/qc-templates')}
      />
    </Stack>
  );
}
