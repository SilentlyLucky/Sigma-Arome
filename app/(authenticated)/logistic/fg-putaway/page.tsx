'use client';

import { Stack, Title, Text, Alert } from '@mantine/core';
import { CollectionList } from '@/components/ui/collection-list';
import { IconInfoCircle } from '@tabler/icons-react';

export default function FGPutawayPage() {
  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Finished Goods Putaway Coordination</Title>
        <Text c="dimmed" size="sm">Monitor FG batches approved by QC and ready for warehouse putaway.</Text>
      </div>
      <Alert icon={<IconInfoCircle size={16} />} color="cyan" variant="light">
        Finished product batches with status <strong>Approved</strong> are ready for Warehouse to put away into FG storage.
      </Alert>
      <CollectionList
        collection="batches"
        enableSearch
        enableSort
        filter={{ batch_type: { _eq: 'finished_product' }, status: { _eq: 'approved' } }}
        fields={['batch_number', 'material_id', 'qty', 'unit', 'status', 'current_location_id']}
      />
    </Stack>
  );
}
