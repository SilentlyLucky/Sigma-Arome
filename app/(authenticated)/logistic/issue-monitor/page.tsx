'use client';

import { Stack, Title, Text } from '@mantine/core';
import { CollectionList } from '@/components/ui/collection-list';

export default function IssueMonitorPage() {
  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Material Release Progress</Title>
        <Text c="dimmed" size="sm">
          Track materials that Warehouse has sent or is preparing to send to production.
        </Text>
      </div>
      <CollectionList
        collection="inventory_movements"
        enableSearch
        enableFilter
        enableSort
        enableHeaderMenu
        enableResize
        filter={{ movement_type: { _eq: 'issue' } }}
        fields={['batch_id', 'from_location_id', 'to_location_id', 'qty', 'reference_type', 'date_created']}
      />
    </Stack>
  );
}
