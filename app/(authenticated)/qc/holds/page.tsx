'use client';

import { Stack, Title, Text } from '@mantine/core';
import { CollectionList } from '@/components/ui/collection-list';
import { useRouter } from 'next/navigation';
import { useNameLookup } from '@/lib/hooks/useNameLookup';

export default function QCHoldsPage() {
  const router = useRouter();
  const materialNames = useNameLookup('raw_materials');

  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Held and Rejected Batches</Title>
        <Text c="dimmed" size="sm">
          Batches that need follow-up because they were put on hold or rejected during QC.
        </Text>
      </div>
      <CollectionList
        collection="batches"
        enableSearch
        enableSort
        filter={{ status: { _in: ['hold', 'rejected'] } }}
        fields={['batch_number', 'material_id', 'qty', 'unit', 'status', 'current_location_id']}
        onItemClick={(item) => router.push(`/qc/inspect/${item.id}`)}
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
