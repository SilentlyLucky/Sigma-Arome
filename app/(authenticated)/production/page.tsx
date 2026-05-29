'use client';

import { SimpleGrid, Paper, Text, Title, Group, Stack, ThemeIcon, Loader, Anchor } from '@mantine/core';
import { IconPlayerPlay, IconClock, IconCheck, IconPackage } from '@tabler/icons-react';
import { useEffect, useState } from 'react';

export default function ProductionDashboard() {
  const [kpis, setKpis] = useState<Array<{ label: string; value: number; color: string; icon: typeof IconPlayerPlay; href?: string }>>([]);
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

      const [ready, inProgress, completed, fgPending] = await Promise.all([
        count('production_orders', { status: { _in: ['ready', 'released'] } }),
        count('production_orders', { status: { _eq: 'in_progress' } }),
        count('production_orders', { status: { _eq: 'completed' } }),
        count('batches', { batch_type: { _eq: 'finished_product' }, status: { _eq: 'qc_pending' } }),
      ]);

      setKpis([
        { label: 'Ready to Start', value: ready, color: 'green', icon: IconPlayerPlay, href: '/production/orders' },
        { label: 'In Progress', value: inProgress, color: 'violet', icon: IconClock, href: '/production/active' },
        { label: 'Completed', value: completed, color: 'teal', icon: IconCheck, href: '/production/completed' },
        { label: 'FG Awaiting QC', value: fgPending, color: 'orange', icon: IconPackage },
      ]);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <Stack gap="lg">
      <div>
        <Title order={2}>Production Execution Board</Title>
        <Text c="dimmed" size="sm">Execute production orders — confirm material receipt, record consumption, yield, and output.</Text>
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
