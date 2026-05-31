'use client';

import { Stack, Title, Text } from '@mantine/core';
import { CollectionList } from '@/components/ui/collection-list';

export default function MovementPriorityPage() {
  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Material Move Priorities</Title>
        <Text c="dimmed" size="sm">
          Active material requests sorted by priority and needed date. Use this to decide what Warehouse should prepare first.
        </Text>
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
