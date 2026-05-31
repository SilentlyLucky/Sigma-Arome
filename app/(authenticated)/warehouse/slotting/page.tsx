'use client';

import { Stack, Title, Text } from '@mantine/core';
import { AutoSlottingPanel } from './_panel';

export default function AutoSlottingPage() {
  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Storage Suggestions</Title>
        <Text c="dimmed" size="sm">
          Find the safest storage locations for approved batches before they are put away.
        </Text>
      </div>
      <AutoSlottingPanel />
    </Stack>
  );
}
