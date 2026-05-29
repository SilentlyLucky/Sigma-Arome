'use client';

import { Stack, Title, Text, Alert } from '@mantine/core';
import { CollectionList } from '@/components/ui/collection-list';
import { IconInfoCircle } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useNameLookup } from '@/lib/hooks/useNameLookup';

export default function PutawayPage() {
  const router = useRouter();
  const materialNames = useNameLookup('raw_materials');

  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Putaway — Approved Batches</Title>
        <Text c="dimmed" size="sm">Assign storage locations and confirm putaway for QC-approved batches.</Text>
      </div>
      <Alert icon={<IconInfoCircle size={16} />} color="teal" variant="light">
        Only batches with status <strong>Approved</strong> appear here. Click a batch to assign a storage location and confirm putaway.
      </Alert>
      <CollectionList
        collection="batches"
        enableSearch
        enableSort
        filter={{ status: { _in: ['approved', 'storage_assigned'] } }}
        fields={['batch_number', 'material_id', 'qty', 'unit', 'status', 'current_location_id']}
        onItemClick={(item) => router.push(`/warehouse/batches/${item.id}`)}
        renderCell={(item, header) => {
          if (header.value === 'material_id') {
            const name = materialNames.get(String(item.material_id ?? ''));
            return name ? <span style={{ fontSize: 'var(--mantine-font-size-sm)' }}>{name}</span> : null;
          }
          return null;
        }}
      />
    </Stack>
  );
}
