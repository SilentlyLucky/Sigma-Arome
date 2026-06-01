'use client';

import { Group, Stack, Text, Title } from '@mantine/core';
import { CollectionList } from '@/components/ui/collection-list';
import { useRouter } from 'next/navigation';

export default function IoTSensorsPage() {
  const router = useRouter();
  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-end" gap="md">
        <div>
          <Title order={2}>IoT Sensors</Title>
          <Text c="dimmed" size="sm">Configure sensors for warehouse temperature and humidity monitoring.</Text>
        </div>
        <Text c="dimmed" size="xs" ta="right" maw={580} style={{ lineHeight: 1.45 }}>
          💡 Right-click column header to sort, align, or hide. Drag the ⋮⋮ grip to reorder columns. Drag edges to resize.
        </Text>
      </Group>
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
