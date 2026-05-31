'use client';

import { Stack, Title, Text } from '@mantine/core';
import { CollectionForm } from '@/components/ui/collection-form';
import { useRouter } from 'next/navigation';

export default function CreateQCTemplatePage() {
  const router = useRouter();

  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Create Quality Check Form</Title>
        <Text c="dimmed" size="sm">Create an inspection form with the checks and limits inspectors should use.</Text>
      </div>
      <CollectionForm
        collection="qc_templates"
        mode="create"
        onSuccess={() => router.push('/admin/qc-templates')}
        onCancel={() => router.push('/admin/qc-templates')}
      />
    </Stack>
  );
}
