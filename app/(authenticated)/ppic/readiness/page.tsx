'use client';

import { Stack, Title, Text, Alert } from '@mantine/core';
import { CollectionList } from '@/components/ui/collection-list';
import { IconInfoCircle } from '@tabler/icons-react';
import { useNameLookup } from '@/lib/hooks/useNameLookup';

export default function MaterialReadinessPage() {
  const materialNames = useNameLookup('raw_materials');

  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Material Readiness</Title>
        <Text c="dimmed" size="sm">
          View approved raw material availability. Check stock before creating production orders.
        </Text>
      </div>

      <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
        This view shows raw material orders and their current status. Materials with status &quot;Received&quot; or &quot;Closed&quot; have been delivered.
        Once QC approves a batch (Phase 4), approved inventory will appear here.
      </Alert>

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
