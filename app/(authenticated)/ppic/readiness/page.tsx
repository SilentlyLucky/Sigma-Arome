'use client';

import { Stack, Title, Text } from '@mantine/core';
import { CollectionList } from '@/components/ui/collection-list';
import { useNameLookup } from '@/lib/hooks/useNameLookup';

export default function MaterialReadinessPage() {
  const materialNames = useNameLookup('raw_materials');

  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Materials Ready for Production</Title>
        <Text c="dimmed" size="sm">
          Check whether raw materials have arrived, passed QC, and are available before planning production. Materials become available after QC approval and warehouse storage.
        </Text>
      </div>

      <CollectionList
        collection="raw_material_orders"
        enableSearch
        enableFilter
        enableSort
        enableResize
        enableHeaderMenu
        fields={['order_number', 'material_id', 'ordered_qty', 'unit', 'status', 'expected_arrival_date']}
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
