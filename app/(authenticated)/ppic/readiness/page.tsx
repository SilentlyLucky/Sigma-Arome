'use client';

import { Stack, Title, Text, Alert } from '@mantine/core';
import { CollectionList } from '@/components/ui/collection-list';
import { IconInfoCircle } from '@tabler/icons-react';

/**
 * Material Readiness View
 *
 * Shows approved raw material availability for production planning.
 * PPIC uses this to check if enough material is available before creating
 * production orders and material requests.
 *
 * Per PRD PPIC-006: PPIC must see approved raw material availability summary.
 */
export default function MaterialReadinessPage() {
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
      />
    </Stack>
  );
}
