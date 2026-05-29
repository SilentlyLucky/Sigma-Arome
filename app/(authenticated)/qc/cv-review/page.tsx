'use client';

import { Stack, Title, Text, Alert } from '@mantine/core';
import { CollectionList } from '@/components/ui/collection-list';
import { IconInfoCircle } from '@tabler/icons-react';

export default function CVReviewPage() {
  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Computer Vision Review</Title>
        <Text c="dimmed" size="sm">AI-assisted inspection results. These are decision support only — final QC decision is made by the inspector.</Text>
      </div>
      <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
        CV results are <strong>simulated</strong> for MVP. In production, this will connect to a trained model.
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
