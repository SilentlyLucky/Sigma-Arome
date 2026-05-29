'use client';

import { Stack, Title, Text, Alert } from '@mantine/core';
import { CollectionList } from '@/components/ui/collection-list';
import { IconInfoCircle } from '@tabler/icons-react';

export default function MaterialIssuePage() {
  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Material Issue to Production</Title>
        <Text c="dimmed" size="sm">Issue approved raw material batches to Production based on Material Requests.</Text>
      </div>
      <Alert icon={<IconInfoCircle size={16} />} color="grape" variant="light">
        Only batches with status <strong>Stored - Available</strong> can be issued. Stock decreases after issue is confirmed.
      </Alert>
      <CollectionList
        collection="batches"
        enableSearch
        enableFilter
        enableSort
        filter={{ status: { _eq: 'stored_available' } }}
        fields={['batch_number', 'material_id', 'qty', 'unit', 'current_location_id', 'expiry_date']}
      />
    </Stack>
  );
}
