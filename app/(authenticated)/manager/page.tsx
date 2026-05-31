'use client';

import { SimpleGrid, Paper, Text, Title, Group, Stack, ThemeIcon, Loader, Anchor, Divider } from '@mantine/core';
import { IconShoppingCart, IconFlask, IconPackage, IconAlertTriangle, IconBuildingFactory, IconCheck } from '@tabler/icons-react';
import { useEffect, useState } from 'react';

export default function ManagerDashboard() {
  const [kpis, setKpis] = useState<Array<{ label: string; value: number; color: string; icon: typeof IconShoppingCart }>>([]);
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

      const [ordersActive, qcPending, qcHold, storedAvailable, prodInProgress, prodCompleted] = await Promise.all([
        count('raw_material_orders', { status: { _in: ['ordered', 'partially_received'] } }),
        count('batches', { status: { _in: ['qc_pending', 'under_qc'] } }),
        count('batches', { status: { _eq: 'hold' } }),
        count('batches', { status: { _eq: 'stored_available' } }),
        count('production_orders', { status: { _eq: 'in_progress' } }),
        count('production_orders', { status: { _eq: 'completed' } }),
      ]);

      setKpis([
        { label: 'Raw Material Orders in Progress', value: ordersActive, color: 'blue', icon: IconShoppingCart },
        { label: 'Batches Waiting for QC', value: qcPending, color: 'orange', icon: IconFlask },
        { label: 'Batches on Hold', value: qcHold, color: 'red', icon: IconAlertTriangle },
        { label: 'Batches Ready for Use', value: storedAvailable, color: 'green', icon: IconPackage },
        { label: 'Production Running', value: prodInProgress, color: 'violet', icon: IconBuildingFactory },
        { label: 'Finished Production Orders', value: prodCompleted, color: 'teal', icon: IconCheck },
      ]);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <Stack gap="lg">
      <div>
        <Title order={2}>Operations Overview</Title>
        <Text c="dimmed" size="sm">A quick view of purchasing, quality checks, warehouse stock, logistics, and production.</Text>
      </div>
      {loading ? <Group justify="center" py="xl"><Loader /></Group> : (
        <SimpleGrid cols={{ base: 2, sm: 3, md: 6 }} spacing="md">
          {kpis.map(k => (
            <Paper key={k.label} p="md" radius="md" withBorder>
              <Stack gap={4} align="center" ta="center">
                <ThemeIcon size="xl" radius="md" variant="light" color={k.color}><k.icon size={24} /></ThemeIcon>
                <Title order={3}>{k.value}</Title>
                <Text size="xs" c="dimmed" lineClamp={2}>{k.label}</Text>
              </Stack>
            </Paper>
          ))}
        </SimpleGrid>
      )}
    </Stack>
  );
}
