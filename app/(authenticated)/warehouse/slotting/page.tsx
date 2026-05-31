'use client';

import { Stack, Title, Text } from '@mantine/core';
import { AutoSlottingPanel } from './_panel';

export default function AutoSlottingPage() {
  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Auto Slotting</Title>
        <Text c="dimmed" size="sm">
          Rule-based storage recommendations for QC-released batches. Scored on Temperature 40% ·
          Hazard 30% · Capacity 15% · Occupancy 15%. No AI — pure rule engine.
        </Text>
      </div>
      <AutoSlottingPanel />
    </Stack>
  );
}
