'use client';

import { Stack, Title, Text } from '@mantine/core';
import { CollectionList } from '@/components/ui/collection-list';
import { useRouter } from 'next/navigation';

export default function IoTSensorsPage() {
  const router = useRouter();
  return (
    <Stack gap="md">
      <div>
        <Title order={2}>IoT Sensors</Title>
        <Text c="dimmed" size="sm">Configure sensors for warehouse temperature and humidity monitoring.</Text>
        <Text c="dimmed" size="xs" mt={4}>💡 Right-click column header to sort, align, or hide. Drag the ⋮⋮ grip to reorder columns. Drag edges to resize.</Text>
      </div>
      <CollectionList
        collection="iot_sensors"
        enableSearch
        enableFilter
        enableCreate
        enableDelete
        enableHeaderMenu
        enableResize
        enableReorder
        enableSort
        fields={['sensor_name', 'sensor_code', 'sensor_type', 'location_id', 'status', 'is_simulated']}
        onCreate={() => router.push('/admin/iot-sensors/create')}
        onItemClick={(item) => router.push(`/admin/iot-sensors/${item.id}`)}
      />
    </Stack>
  );
}
