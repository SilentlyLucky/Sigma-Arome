'use client';

import { Stack, Title, Text, Badge, Alert } from '@mantine/core';
import { CollectionList } from '@/components/ui/collection-list';
import { IconInfoCircle } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';

/**
 * Inspection History — CV data shown inline as direct columns.
 * cv_confidence and cv_recommendation are stored on qc_inspections
 * (written back by the CV simulation extension) so no join is needed.
 */

const REC_COLORS: Record<string, string> = {
  approve: 'green',
  review: 'orange',
  reject: 'red',
};

export default function QCHistoryPage() {
  const router = useRouter();

  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Inspection History</Title>
        <Text c="dimmed" size="sm">
          All QC inspections with AI confidence scores and recommendations inline.
        </Text>
      </div>

      <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
        AI scores are <strong>simulated</strong> for MVP and generated automatically when a batch enters QC Pending.
      </Alert>

      <CollectionList
        collection="qc_inspections"
        enableSearch
        enableFilter
        enableSort
        enableHeaderMenu
        enableResize
        fields={[
          'inspection_number',
          'batch_id',
          'inspection_type',
          'decision',
          'cv_confidence',
          'cv_recommendation',
          'started_at',
          'completed_at',
        ]}
        onItemClick={(item) => router.push(`/qc/inspect/${item.batch_id}`)}
        renderCell={(item, header) => {
          if (header.value === 'cv_confidence') {
            const score = item.cv_confidence as number | null;
            if (score == null) return <Text size="sm" c="dimmed">—</Text>;
            const pct = (score * 100).toFixed(1);
            const color = score >= 0.9 ? 'green' : score >= 0.7 ? 'orange' : 'red';
            return <Badge size="sm" color={color} variant="light">{pct}%</Badge>;
          }
          if (header.value === 'cv_recommendation') {
            const rec = item.cv_recommendation as string | null;
            if (!rec) return <Text size="sm" c="dimmed">—</Text>;
            return (
              <Badge size="sm" color={REC_COLORS[rec] ?? 'gray'} variant="light">
                {rec}
              </Badge>
            );
          }
          return null;
        }}
      />
    </Stack>
  );
}
