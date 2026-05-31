'use client';

import { Stack, Title, Text, Alert } from '@mantine/core';
import { CollectionList } from '@/components/ui/collection-list';
import { IconInfoCircle } from '@tabler/icons-react';
import { useNameLookup } from '@/lib/hooks/useNameLookup';

export default function MaterialIssuePage() {
  const materialNames = useNameLookup('raw_materials');

  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Send Materials to Production</Title>
        <Text c="dimmed" size="sm">
          Send approved raw material batches to production when they are needed for active orders.
        </Text>
      </div>
      <Alert icon={<IconInfoCircle size={16} />} color="grape" variant="light">
        Only batches marked <strong>Available for production</strong> can be sent. Stock is reduced after the send is confirmed.
      </Alert>
      <CollectionList
        collection="batches"
        enableSearch
        enableFilter
        enableSort
        filter={{ status: { _eq: 'stored_available' } }}
        fields={['batch_number', 'material_id', 'qty', 'unit', 'current_location_id', 'expiry_date']}
        renderCell={(item, header) => {
          if (header.value === 'material_id') {
            const name = materialNames.get(String(item.material_id ?? ''));
            return name ? <span style={{ fontSize: 'var(--mantine-font-size-sm)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, maxWidth: '100%', display: 'block' }}>{name}</span> : null;
          }
          return null;
        }}
      />
    </Stack>
  );
}
