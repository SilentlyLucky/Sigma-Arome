'use client';

import { Stack, Title, Text } from '@mantine/core';
import { CollectionList } from '@/components/ui/collection-list';
import { useNameLookup } from '@/lib/hooks/useNameLookup';

export default function ExpectedIncomingPage() {
  const materialNames = useNameLookup('raw_materials');
  const supplierNames = useNameLookup('suppliers', 'supplier_name');

  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Expected Raw Material Deliveries</Title>
        <Text c="dimmed" size="sm">
          Raw material orders expected to arrive soon. Use this list to prepare receiving.
        </Text>
      </div>
      <CollectionList
        collection="raw_material_orders"
        enableSearch
        enableFilter
        enableSort
        filter={{ status: { _in: ['ordered', 'partially_received'] } }}
        fields={['order_number', 'material_id', 'supplier_id', 'ordered_qty', 'unit', 'expected_arrival_date', 'priority', 'status']}
        renderCell={(item, header) => {
          if (header.value === 'material_id') {
            const name = materialNames.get(String(item.material_id ?? ''));
            return name ? <span style={{ fontSize: 'var(--mantine-font-size-sm)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, maxWidth: '100%', display: 'block' }}>{name}</span> : null;
          }
          if (header.value === 'supplier_id') {
            const name = supplierNames.get(String(item.supplier_id ?? ''));
            return name ? <span style={{ fontSize: 'var(--mantine-font-size-sm)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, maxWidth: '100%', display: 'block' }}>{name}</span> : null;
          }
          return null;
        }}
      />
    </Stack>
  );
}
