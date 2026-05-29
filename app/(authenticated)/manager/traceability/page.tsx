'use client';

import { Stack, Title, Text, Alert } from '@mantine/core';
import { CollectionList } from '@/components/ui/collection-list';
import { IconInfoCircle } from '@tabler/icons-react';

export default function TraceabilityPage() {
  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Batch Traceability</Title>
        <Text c="dimmed" size="sm">Trace batch genealogy — from raw material order to finished product.</Text>
      </div>
      <Alert icon={<IconInfoCircle size={16} />} color="indigo" variant="light">
        Click a batch to view its full history: order → receipt → QC → storage → production → FG.
      </Alert>
      <CollectionList
        collection="batches"
        enableSearch
        enableFilter
        enableSort
        enableHeaderMenu
        enableResize
        fields={['batch_number', 'material_id', 'batch_type', 'qty', 'unit', 'status', 'current_location_id']}
      />
    </Stack>
  );
}
