'use client';

import { Stack, Title, Text, Alert } from '@mantine/core';
import { CollectionForm } from '@/components/ui/collection-form';
import { IconInfoCircle } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';

export default function CreateMaterialRequestPage() {
  const router = useRouter();
  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Create Material Request</Title>
        <Text c="dimmed" size="sm">
          Request raw materials from Warehouse for production. Select the Production Order and set the needed date.
        </Text>
      </div>
      <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
        After creating the request header, add line items (materials + quantities) on the detail page.
        Request number is auto-generated. Status starts as <strong>Draft</strong> — submit when ready.
      </Alert>
      <CollectionForm
        collection="material_requests"
        mode="create"
        onSuccess={(item) => router.push(`/ppic/requests/${item?.id ?? ''}`)}
        onCancel={() => router.push('/ppic/requests')}
      />
    </Stack>
  );
}
