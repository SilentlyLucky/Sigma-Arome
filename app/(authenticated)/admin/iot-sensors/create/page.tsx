'use client';

import { Stack, Title, Text } from '@mantine/core';
import { CollectionForm } from '@/components/ui/collection-form';
import { useRouter } from 'next/navigation';

export default function CreateIoTSensorPage() {
  const router = useRouter();

  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Create IoT Sensor</Title>
        <Text c="dimmed" size="sm">Add a new sensor for warehouse monitoring.</Text>
      </div>
      <CollectionForm
        collection="iot_sensors"
        mode="create"
        onSuccess={() => router.push('/admin/iot-sensors')}
        onCancel={() => router.push('/admin/iot-sensors')}
      />
    </Stack>
  );
}
