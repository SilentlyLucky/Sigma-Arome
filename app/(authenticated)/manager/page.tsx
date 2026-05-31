'use client';

import { SimpleGrid, Paper, Text, Title, Group, Stack, ThemeIcon, Loader, Anchor, Divider } from '@mantine/core';
import { IconShoppingCart, IconFlask, IconPackage, IconAlertTriangle, IconBuildingFactory, IconCheck } from '@tabler/icons-react';
import { useEffect, useState } from 'react';

export default function ManagerDashboard() {
  const [kpis, setKpis] = useState<Array<{ label: string; value: number; color: string; icon: typeof IconShoppingCart }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const counts = await fetch('/api/batch-counts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          counts: [
            { key: 'ordersActive', collection: 'raw_material_orders', filter: { status: { _in: ['ordered', 'partially_received'] } } },
            { key: 'qcPending', collection: 'batches', filter: { status: { _in: ['qc_pending', 'under_qc'] } } },
            { key: 'qcHold', collection: 'batches', filter: { status: { _eq: 'hold' } } },
            { key: 'storedAvailable', collection: 'batches', filter: { status: { _eq: 'stored_available' } } },
            { key: 'prodInProgress', collection: 'production_orders', filter: { status: { _eq: 'in_progress' } } },
            { key: 'prodCompleted', collection: 'production_orders', filter: { status: { _eq: 'completed' } } },
          ],
        }),
      }).then(async (res) => (res.ok ? ((await res.json())?.counts ?? {}) : {})).catch(() => ({}));
      const ordersActive = Number(counts.ordersActive ?? 0);
      const qcPending = Number(counts.qcPending ?? 0);
      const qcHold = Number(counts.qcHold ?? 0);
      const storedAvailable = Number(counts.storedAvailable ?? 0);
      const prodInProgress = Number(counts.prodInProgress ?? 0);
      const prodCompleted = Number(counts.prodCompleted ?? 0);

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
