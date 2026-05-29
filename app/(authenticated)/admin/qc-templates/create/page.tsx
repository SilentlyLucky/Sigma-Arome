'use client';

import { Stack, Title, Text } from '@mantine/core';
import { CollectionForm } from '@/components/ui/collection-form';
import { useRouter } from 'next/navigation';

export default function CreateQCTemplatePage() {
  const router = useRouter();

  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Create QC Template</Title>
        <Text c="dimmed" size="sm">Define a new QC parameter template.</Text>
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
