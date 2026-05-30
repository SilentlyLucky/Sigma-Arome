'use client';

import { Stack, Title, Text, Badge, Alert } from '@mantine/core';
import { CollectionList } from '@/components/ui/collection-list';
import { IconInfoCircle } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

/**
 * Inspection History — merged with CV Review data.
 * Shows all QC inspections with their AI confidence score and recommendation
 * inline, eliminating the need for a separate CV Review tab.
 */

interface CVResult {
  inspection_id: string;
  confidence_score: number;
  recommendation: string;
  defect_type: string;
  is_simulated: boolean;
}

const REC_COLORS: Record<string, string> = {
  approve: 'green',
  review: 'orange',
  reject: 'red',
};

export default function QCHistoryPage() {
  const router = useRouter();
  // Map: inspection_id → CVResult
  const [cvMap, setCvMap] = useState<Record<string, CVResult>>({});

  // Load all CV results once so we can join them to inspections in renderCell
  useEffect(() => {
    fetch('/api/items/cv_results?fields[]=inspection_id&fields[]=confidence_score&fields[]=recommendation&fields[]=defect_type&fields[]=is_simulated&limit=500&sort[]=-date_created')
      .then(r => r.json())
      .then(d => {
        const map: Record<string, CVResult> = {};
        for (const row of (d?.data ?? [])) {
          // Keep only the most recent CV result per inspection
          if (!map[row.inspection_id]) map[row.inspection_id] = row;
        }
        setCvMap(map);
      })
      .catch(() => {});
  }, []);

  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Inspection History</Title>
        <Text c="dimmed" size="sm">
          All completed QC inspections with AI confidence scores and recommendations.
          CV data is shown inline — no separate tab needed.
        </Text>
      </div>

      <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
        AI scores are <strong>simulated</strong> for MVP. Confidence and recommendation are generated automatically
        when a batch enters QC Pending status.
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
          // CV columns — rendered via renderCell using the cvMap
          'confidence_score',
          'recommendation',
          'started_at',
          'completed_at',
        ]}
        onItemClick={(item) => router.push(`/qc/inspect/${item.batch_id}`)}
        renderCell={(item, header) => {
          const inspectionId = String(item.id ?? '');
          const cv = cvMap[inspectionId];

          if (header.value === 'confidence_score') {
            if (!cv) return <Text size="sm" c="dimmed">—</Text>;
            const pct = (cv.confidence_score * 100).toFixed(1);
            const color = cv.confidence_score >= 0.9 ? 'green' : cv.confidence_score >= 0.7 ? 'orange' : 'red';
            return (
              <Badge size="sm" color={color} variant="light">
                {pct}%
              </Badge>
            );
          }

          if (header.value === 'recommendation') {
            if (!cv) return <Text size="sm" c="dimmed">—</Text>;
            return (
              <Badge size="sm" color={REC_COLORS[cv.recommendation] ?? 'gray'} variant="light">
                {cv.recommendation}
              </Badge>
            );
          }

          return null;
        }}
      />
    </Stack>
  );
}
