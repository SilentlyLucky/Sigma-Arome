'use client';

import { SimpleGrid, Paper, Text, Title, Group, Stack, ThemeIcon, Loader, Anchor } from '@mantine/core';
import { IconClipboardList, IconTransferOut, IconClock, IconPackage, IconAlertTriangle } from '@tabler/icons-react';
import { useEffect, useState } from 'react';

export default function LogisticDashboard() {
  const [kpis, setKpis] = useState<Array<{ label: string; value: number; color: string; icon: typeof IconClipboardList; href?: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const counts = await fetch('/api/batch-counts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          counts: [
            { key: 'submitted', collection: 'material_requests', filter: { status: { _eq: 'submitted' } } },
            { key: 'approved', collection: 'material_requests', filter: { status: { _eq: 'approved' } } },
            { key: 'issued', collection: 'material_requests', filter: { status: { _in: ['partially_issued', 'issued'] } } },
            { key: 'storedAvailable', collection: 'batches', filter: { status: { _eq: 'stored_available' } } },
          ],
        }),
      }).then(async (res) => (res.ok ? ((await res.json())?.counts ?? {}) : {})).catch(() => ({}));
      const submitted = Number(counts.submitted ?? 0);
      const approved = Number(counts.approved ?? 0);
      const issued = Number(counts.issued ?? 0);
      const storedAvailable = Number(counts.storedAvailable ?? 0);

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
