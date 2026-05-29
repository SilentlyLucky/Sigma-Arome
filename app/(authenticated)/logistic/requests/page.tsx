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
        <Title order={2}>Material Request Queue</Title>
        <Text c="dimmed" size="sm">PPIC material requests submitted for coordination. Review, approve, and assign to Warehouse.</Text>
      </div>
      <Alert icon={<IconInfoCircle size={16} />} color="cyan" variant="light">
        Requests with status <strong>Submitted</strong> need your review. Approve to allow Warehouse to issue material.
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
