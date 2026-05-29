'use client';

import { Stack, Title, Text } from '@mantine/core';
import { CollectionList } from '@/components/ui/collection-list';
import { useRouter } from 'next/navigation';

export default function QCHistoryPage() {
  const router = useRouter();
  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Inspection History</Title>
        <Text c="dimmed" size="sm">All completed QC inspections with decisions.</Text>
      </div>
      <CollectionList
        collection="qc_inspections"
        enableSearch
        enableFilter
        enableSort
        enableHeaderMenu
        enableResize
        fields={['inspection_number', 'batch_id', 'inspection_type', 'decision', 'started_at', 'completed_at']}
        onItemClick={(item) => router.push(`/qc/inspect/${item.batch_id}`)}
      />
    </Stack>
  );
}
