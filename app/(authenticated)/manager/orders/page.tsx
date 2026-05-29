'use client';

import { Stack, Title, Text } from '@mantine/core';
import { CollectionList } from '@/components/ui/collection-list';
import { useNameLookup } from '@/lib/hooks/useNameLookup';

export default function ManagerOrdersPage() {
  const materialNames = useNameLookup('raw_materials');
  const supplierNames = useNameLookup('suppliers', 'supplier_name');

  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Raw Material Orders</Title>
        <Text c="dimmed" size="sm">All PPIC raw material orders — read-only overview.</Text>
      </div>
      <CollectionList
        collection="raw_material_orders"
        enableSearch
        enableFilter
        enableSort
        enableHeaderMenu
        enableResize
        fields={['order_number', 'material_id', 'supplier_id', 'ordered_qty', 'unit', 'status', 'priority', 'expected_arrival_date']}
        renderCell={(item, header) => {
          if (header.value === 'material_id') {
            const name = materialNames.get(String(item.material_id ?? ''));
            return name ? <span style={{ fontSize: 'var(--mantine-font-size-sm)' }}>{name}</span> : null;
          }
          if (header.value === 'supplier_id') {
            const name = supplierNames.get(String(item.supplier_id ?? ''));
            return name ? <span style={{ fontSize: 'var(--mantine-font-size-sm)' }}>{name}</span> : null;
          }
          return null;
        }}
      />
    </Stack>
  );
}
