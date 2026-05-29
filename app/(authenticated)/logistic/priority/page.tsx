'use client';

import { Stack, Title, Text } from '@mantine/core';
import { CollectionList } from '@/components/ui/collection-list';

export default function MovementPriorityPage() {
  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Movement Priority Board</Title>
        <Text c="dimmed" size="sm">All active material requests sorted by priority and needed date. Coordinate with Warehouse for timely execution.</Text>
      </div>
      <CollectionList
        collection="material_requests"
        enableSearch
        enableFilter
        enableSort
        enableHeaderMenu
        enableResize
        filter={{ status: { _in: ['submitted', 'approved', 'partially_issued'] } }}
        fields={['request_number', 'production_order_id', 'needed_date', 'priority', 'status']}
      />
    </Stack>
  );
}
