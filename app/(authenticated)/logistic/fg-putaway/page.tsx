'use client';

import { Stack, Title, Text, Alert } from '@mantine/core';
import { CollectionList } from '@/components/ui/collection-list';
import { IconInfoCircle } from '@tabler/icons-react';
import { useNameLookup } from '@/lib/hooks/useNameLookup';

export default function FGPutawayPage() {
  const materialNames = useNameLookup('raw_materials');

  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Finished Goods Storage</Title>
        <Text c="dimmed" size="sm">
          Finished product batches approved by QC and ready to be stored.
        </Text>
      </div>
      <Alert icon={<IconInfoCircle size={16} />} color="cyan" variant="light">
        Finished product batches approved by QC are ready for Warehouse to move into finished goods storage.
      </Alert>
      <CollectionList
        collection="batches"
        enableSearch
        enableSort
        filter={{ batch_type: { _eq: 'finished_product' }, status: { _eq: 'approved' } }}
        fields={['batch_number', 'material_id', 'qty', 'unit', 'status', 'current_location_id']}
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
