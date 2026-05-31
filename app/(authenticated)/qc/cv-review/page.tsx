'use client';

import { Stack, Title, Text, Alert } from '@mantine/core';
import { CollectionList } from '@/components/ui/collection-list';
import { IconInfoCircle } from '@tabler/icons-react';

export default function CVReviewPage() {
  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Image Quality Check Review</Title>
        <Text c="dimmed" size="sm">
          Review image check suggestions. The final QC decision is always made by the inspector.
        </Text>
      </div>
      <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
        These suggestions support inspection review and should not replace manual QC judgment.
      </Alert>
      <CollectionList
        collection="cv_results"
        enableSearch
        enableSort
        enableHeaderMenu
        enableResize
        fields={['inspection_id', 'defect_type', 'confidence_score', 'recommendation', 'is_simulated', 'date_created']}
      />
    </Stack>
  );
}
