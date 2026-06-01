'use client';

import { Stack, Title, Text, ActionIcon, Tooltip, Badge } from '@mantine/core';
import { CollectionList } from '@/components/ui/collection-list';
import { IconMicroscope } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useNameLookup } from '@/lib/hooks/useNameLookup';

export default function QCQueuePage() {
  const router = useRouter();
  const materialNames = useNameLookup('raw_materials');
  const productNames = useNameLookup('products');

  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Batches Waiting for Inspection</Title>
        <Text c="dimmed" size="sm">
          Batches that need QC review. Select a batch to start or continue the inspection.
          Finished Goods come from production; Raw Material batches come from receiving.
          The AI image check is a suggestion only — you make the final call.
        </Text>
      </div>
      <CollectionList
        collection="batches"
        enableSearch
        enableFilter
        enableSort
        enableHeaderMenu
        enableResize
        filter={{ status: { _in: ['qc_pending', 'under_qc', 'hold'] } }}
        fields={['batch_number', 'batch_type', 'material_id', 'product_id', 'qty', 'unit', 'status', 'expiry_date']}
        onItemClick={(item) => router.push(`/qc/inspect/${item.id}`)}
        renderCell={(item, header) => {
          if (header.value === 'batch_type') {
            const isFG = item.batch_type === 'finished_product';
            return (
              <Badge size="sm" color={isFG ? 'grape' : 'blue'} variant="light">
                {isFG ? 'Finished Goods' : 'Raw Material'}
              </Badge>
            );
          }
          if (header.value === 'material_id') {
            const id = String(item.material_id ?? '');
            const name = id ? materialNames.get(id) : null;
            return name ? <span style={{ fontSize: 'var(--mantine-font-size-sm)' }}>{name}</span> : <span style={{ color: 'var(--mantine-color-dimmed)' }}>—</span>;
          }
          if (header.value === 'product_id') {
            const id = String(item.product_id ?? '');
            const name = id ? productNames.get(id) : null;
            return name ? <span style={{ fontSize: 'var(--mantine-font-size-sm)' }}>{name}</span> : <span style={{ color: 'var(--mantine-color-dimmed)' }}>—</span>;
          }
          return null;
        }}
        renderRowAppend={(item) => (
          <Tooltip label="Inspect batch" position="left" withArrow>
            <ActionIcon
              variant="subtle"
              color="blue"
              size="sm"
              onClick={(e) => { e.stopPropagation(); router.push(`/qc/inspect/${item.id}`); }}
              aria-label="Inspect batch"
            >
              <IconMicroscope size={16} />
            </ActionIcon>
          </Tooltip>
        )}
      />
    </Stack>
  );
}
