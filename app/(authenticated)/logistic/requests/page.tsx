'use client';

import { Stack, Title, Text, Alert } from '@mantine/core';
import { CollectionList } from '@/components/ui/collection-list';
import { IconInfoCircle } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';

export default function LogisticRequestsPage() {
  const router = useRouter();
  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Material Requests to Review</Title>
        <Text c="dimmed" size="sm">
          Review material requests from PPIC and approve the ones Warehouse should prepare for production.
        </Text>
      </div>
      <Alert icon={<IconInfoCircle size={16} />} color="cyan" variant="light">
        Submitted requests need your review. Approve them when Warehouse should prepare the materials for production.
      </Alert>
      <CollectionList
        collection="material_requests"
        enableSearch
        enableFilter
        enableSort
        enableHeaderMenu
        enableResize
        filter={{ status: { _in: ['submitted', 'approved', 'partially_issued'] } }}
        fields={['request_number', 'production_order_id', 'needed_date', 'priority', 'status']}
        onItemClick={(item) => router.push(`/logistic/requests/${item.id}`)}
      />
    </Stack>
  );
}
