'use client';

import { Stack, Title, Text, Alert, ActionIcon, Tooltip } from '@mantine/core';
import { CollectionList } from '@/components/ui/collection-list';
import { IconInfoCircle, IconMicroscope } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useNameLookup } from '@/lib/hooks/useNameLookup';

export default function QCQueuePage() {
  const router = useRouter();
  const materialNames = useNameLookup('raw_materials');

  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Batches Waiting for Inspection</Title>
        <Text c="dimmed" size="sm">
          Batches that need QC review. Select a batch to start or continue the inspection.
        </Text>
      </div>
      <Alert icon={<IconInfoCircle size={16} />} color="grape" variant="light">
        The image quality check gives a suggestion only. Review it, enter your QC findings, then make the final decision.
      </Alert>
      <CollectionList
        collection="batches"
        enableSearch
        enableFilter
        enableSort
        enableHeaderMenu
        enableResize
        filter={{ status: { _in: ['qc_pending', 'under_qc', 'hold'] } }}
        fields={['batch_number', 'material_id', 'batch_type', 'qty', 'unit', 'status', 'expiry_date']}
        onItemClick={(item) => router.push(`/qc/inspect/${item.id}`)}
        renderCell={(item, header) => {
          if (header.value === 'material_id') {
            const name = materialNames.get(String(item.material_id ?? ''));
            return name ? <span style={{ fontSize: 'var(--mantine-font-size-sm)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, maxWidth: '100%', display: 'block' }}>{name}</span> : null;
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
