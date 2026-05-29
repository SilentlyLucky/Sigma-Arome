'use client';

import { Stack, Title, Text, Alert } from '@mantine/core';
import { CollectionList } from '@/components/ui/collection-list';
import { IconInfoCircle } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';

export default function QCQueuePage() {
  const router = useRouter();
  return (
    <Stack gap="md">
      <div>
        <Title order={2}>QC Queue</Title>
        <Text c="dimmed" size="sm">Batches pending QC inspection. Click a batch to start or continue inspection.</Text>
      </div>
      <Alert icon={<IconInfoCircle size={16} />} color="grape" variant="light">
        Starting an inspection auto-generates a CV analysis result. Review the CV recommendation, enter manual QC parameters, then make your decision.
      </Alert>
      <CollectionList
        collection="batches"
        enableSearch
        enableFilter
        enableSort
        enableHeaderMenu
        enableResize
        filter={{ status: { _in: ['qc_pending', 'under_qc', 'hold'] } }}
        fields={['batch_number', 'material_id', 'batch_type', 'qty', 'unit', 'status', 'expiry_date']}
        onItemClick={(item) => router.push(`/qc/inspect/${item.id}`)}
      />
    </Stack>
  );
}
