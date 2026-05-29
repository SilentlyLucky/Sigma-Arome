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
      const count = async (collection: string, filter?: Record<string, unknown>) => {
        try {
          const params = new URLSearchParams({ 'aggregate[count]': '*' });
          if (filter) params.set('filter', JSON.stringify(filter));
          const r = await fetch(`/api/items/${collection}?${params}`);
          if (!r.ok) return 0;
          return Number((await r.json())?.data?.[0]?.count ?? 0);
        } catch { return 0; }
      };

      const [qcPending, underQc, hold, rejected, approved] = await Promise.all([
        count('batches', { status: { _eq: 'qc_pending' } }),
        count('batches', { status: { _eq: 'under_qc' } }),
        count('batches', { status: { _eq: 'hold' } }),
        count('batches', { status: { _eq: 'rejected' } }),
        count('qc_inspections', { decision: { _eq: 'approved' } }),
      ]);

      setKpis([
        { label: 'QC Pending', value: qcPending, color: 'orange', href: '/qc/queue' },
        { label: 'Under QC', value: underQc, color: 'blue', href: '/qc/queue' },
        { label: 'On Hold', value: hold, color: 'yellow', href: '/qc/holds' },
        { label: 'Rejected', value: rejected, color: 'red', href: '/qc/holds' },
        { label: 'Approved (total)', value: approved, color: 'green' },
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
        <Text c="dimmed" size="sm">Quality Control — inspect raw materials and finished products, review CV results, make QC decisions.</Text>
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
