'use client';

import { SimpleGrid, Paper, Text, Title, Group, Stack, ThemeIcon, Loader, Anchor } from '@mantine/core';
import { IconPlayerPlay, IconClock, IconCheck, IconPackage } from '@tabler/icons-react';
import { useEffect, useState } from 'react';

export default function ProductionDashboard() {
  const [kpis, setKpis] = useState<Array<{ label: string; value: number; color: string; icon: typeof IconPlayerPlay; href?: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const counts = await fetch('/api/batch-counts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          counts: [
            { key: 'ready', collection: 'production_orders', filter: { status: { _in: ['ready', 'released'] } } },
            { key: 'inProgress', collection: 'production_orders', filter: { status: { _eq: 'in_progress' } } },
            { key: 'completed', collection: 'production_orders', filter: { status: { _eq: 'completed' } } },
            { key: 'fgPending', collection: 'batches', filter: { batch_type: { _eq: 'finished_product' }, status: { _eq: 'qc_pending' } } },
          ],
        }),
      }).then(async (res) => (res.ok ? ((await res.json())?.counts ?? {}) : {})).catch(() => ({}));
      const ready = Number(counts.ready ?? 0);
      const inProgress = Number(counts.inProgress ?? 0);
      const completed = Number(counts.completed ?? 0);
      const fgPending = Number(counts.fgPending ?? 0);

      setKpis([
        { label: 'Ready to Start', value: ready, color: 'green', icon: IconPlayerPlay, href: '/production/orders' },
        { label: 'Being Produced', value: inProgress, color: 'violet', icon: IconClock, href: '/production/active' },
        { label: 'Finished Orders', value: completed, color: 'teal', icon: IconCheck, href: '/production/completed' },
        { label: 'Finished Goods Waiting for QC', value: fgPending, color: 'orange', icon: IconPackage },
      ]);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <Stack gap="lg">
      <div>
        <Title order={2}>Production Workbench</Title>
        <Text c="dimmed" size="sm">Start production orders, record materials used, and confirm finished output.</Text>
      </div>
      {loading ? <Group justify="center" py="xl"><Loader /></Group> : (
        <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
          {kpis.map(k => (
            <Paper key={k.label} p="md" radius="md" withBorder>
              <Group justify="space-between" wrap="nowrap">
                <Stack gap={4}>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>{k.label}</Text>
                  <Title order={3}>{k.value}</Title>
                </Stack>
                <ThemeIcon size="xl" radius="md" variant="light" color={k.color}><k.icon size={24} /></ThemeIcon>
              </Group>
              {k.href && <Anchor href={k.href} size="xs" c="dimmed" mt={4} display="block">View →</Anchor>}
            </Paper>
          ))}
        </SimpleGrid>
      )}
    </Stack>
  );
}
