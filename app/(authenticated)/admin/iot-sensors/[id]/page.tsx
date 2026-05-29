'use client';

import { Stack, Title, Text } from '@mantine/core';
import { CollectionForm } from '@/components/ui/collection-form';
import { useRouter, useParams } from 'next/navigation';

export default function EditIoTSensorPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Edit IoT Sensor</Title>
        <Text c="dimmed" size="sm">Update sensor configuration.</Text>
      </div>
      <CollectionForm
        collection="iot_sensors"
        mode="edit"
        id={id}
        onSuccess={() => router.push('/admin/iot-sensors')}
        onCancel={() => router.push('/admin/iot-sensors')}
      />
    </Stack>
  );
}
