'use client';

import { Stack, Title, Text, Alert } from '@mantine/core';
import { CollectionForm } from '@/components/ui/collection-form';
import { IconInfoCircle } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';

export default function CreateBOMPage() {
  const router = useRouter();
  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Create BOM / Formula</Title>
        <Text c="dimmed" size="sm">
          Define material requirements for a product. After creating the BOM header, add line items with material quantities.
        </Text>
      </div>
      <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
        Select a product, set the version, then save. You can add BOM items (materials + quantities) after saving.
      </Alert>
      <CollectionForm
        collection="boms"
        mode="create"
        onSuccess={(item) => router.push(`/ppic/bom/${item?.id ?? ''}`)}
        onCancel={() => router.push('/ppic/bom')}
      />
    </Stack>
  );
}
