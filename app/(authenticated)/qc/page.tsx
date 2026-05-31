'use client';

import { SimpleGrid, Paper, Text, Title, Group, Stack, ThemeIcon, Loader, Anchor } from '@mantine/core';
import { IconFlask, IconEye, IconAlertTriangle, IconCheck, IconX } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import React from 'react';

export default function QCDashboard() {
  const [kpis, setKpis] = useState<Array<{ label: string; value: number; color: string; href?: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const counts = await fetch('/api/batch-counts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          counts: [
            { key: 'qcPending', collection: 'batches', filter: { status: { _eq: 'qc_pending' } } },
            { key: 'underQc', collection: 'batches', filter: { status: { _eq: 'under_qc' } } },
            { key: 'hold', collection: 'batches', filter: { status: { _eq: 'hold' } } },
            { key: 'rejected', collection: 'batches', filter: { status: { _eq: 'rejected' } } },
            { key: 'approved', collection: 'qc_inspections', filter: { decision: { _eq: 'approved' } } },
          ],
        }),
      }).then(async (res) => (res.ok ? ((await res.json())?.counts ?? {}) : {})).catch(() => ({}));
      const qcPending = Number(counts.qcPending ?? 0);
      const underQc = Number(counts.underQc ?? 0);
      const hold = Number(counts.hold ?? 0);
      const rejected = Number(counts.rejected ?? 0);
      const approved = Number(counts.approved ?? 0);

      setKpis([
        { label: 'Waiting for QC', value: qcPending, color: 'orange', href: '/qc/queue' },
        { label: 'Being Inspected', value: underQc, color: 'blue', href: '/qc/queue' },
        { label: 'On Hold', value: hold, color: 'yellow', href: '/qc/holds' },
        { label: 'Rejected', value: rejected, color: 'red', href: '/qc/holds' },
        { label: 'Approved Inspections', value: approved, color: 'green' },
      ]);
      setLoading(false);
    }
    load();
  }, []);

  const icons = [IconFlask, IconEye, IconAlertTriangle, IconX, IconCheck];

  return (
    <Stack gap="lg">
      <div>
        <Title order={2}>QC Workbench</Title>
        <Text c="dimmed" size="sm">Inspect raw materials and finished goods, review image check suggestions, and record QC decisions.</Text>
      </div>
      {loading ? <Group justify="center" py="xl"><Loader /></Group> : (
        <SimpleGrid cols={{ base: 2, sm: 3, md: 5 }} spacing="md">
          {kpis.map((k, i) => (
            <Paper key={k.label} p="md" radius="md" withBorder>
              <Group justify="space-between" wrap="nowrap">
                <Stack gap={4}>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>{k.label}</Text>
                  <Title order={3}>{k.value}</Title>
                </Stack>
                <ThemeIcon size="xl" radius="md" variant="light" color={k.color}>{React.createElement(icons[i] ?? IconFlask, { size: 24 })}</ThemeIcon>
              </Group>
              {k.href && <Anchor href={k.href} size="xs" c="dimmed" mt={4} display="block">View →</Anchor>}
            </Paper>
          ))}
        </SimpleGrid>
      )}
    </Stack>
  );
}
