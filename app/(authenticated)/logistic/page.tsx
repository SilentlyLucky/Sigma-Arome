'use client';

import { SimpleGrid, Paper, Text, Title, Group, Stack, ThemeIcon, Loader, Anchor } from '@mantine/core';
import { IconClipboardList, IconTransferOut, IconClock, IconPackage, IconAlertTriangle } from '@tabler/icons-react';
import { useEffect, useState } from 'react';

export default function LogisticDashboard() {
  const [kpis, setKpis] = useState<Array<{ label: string; value: number; color: string; icon: typeof IconClipboardList; href?: string }>>([]);
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

      const [submitted, approved, issued, storedAvailable] = await Promise.all([
        count('material_requests', { status: { _eq: 'submitted' } }),
        count('material_requests', { status: { _eq: 'approved' } }),
        count('material_requests', { status: { _in: ['partially_issued', 'issued'] } }),
        count('batches', { status: { _eq: 'stored_available' } }),
      ]);

      setKpis([
        { label: 'Requests Waiting for Review', value: submitted, color: 'orange', icon: IconClipboardList, href: '/logistic/requests' },
        { label: 'Approved, Waiting to Send', value: approved, color: 'blue', icon: IconTransferOut, href: '/logistic/issue-monitor' },
        { label: 'Materials Being Sent', value: issued, color: 'green', icon: IconClock },
        { label: 'Batches Available for Production', value: storedAvailable, color: 'teal', icon: IconPackage },
      ]);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <Stack gap="lg">
      <div>
        <Title order={2}>Logistic Coordination Dashboard</Title>
        <Text c="dimmed" size="sm">Review material requests, prioritize urgent moves, and track what has been sent to production.</Text>
      </div>
      {loading ? <Group justify="center" py="xl"><Loader /></Group> : (
        <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
          {kpis.map(k => (
            <Paper key={k.label} p="md" radius="md" withBorder>
              <Group justify="space-between" wrap="nowrap">
                <Stack gap={4}>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700} lineClamp={2}>{k.label}</Text>
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
