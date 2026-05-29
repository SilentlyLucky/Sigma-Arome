'use client';

import { SimpleGrid, Paper, Text, Title, Group, Stack, ThemeIcon, Loader, Anchor } from '@mantine/core';
import { IconTruckDelivery, IconBarcode, IconMapPin, IconTransferOut, IconAlertTriangle } from '@tabler/icons-react';
import { useEffect, useState } from 'react';

interface KPI { label: string; value: number | null; icon: typeof IconTruckDelivery; color: string; href?: string }

export default function WarehouseDashboard() {
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const count = async (collection: string, filter?: Record<string, unknown>) => {
        try {
          const params = new URLSearchParams({ 'aggregate[count]': '*' });
          if (filter) params.set('filter', JSON.stringify(filter));
          const r = await fetch(`/api/items/${collection}?${params}`);
          if (!r.ok) return 0;
          const d = await r.json();
          return Number(d?.data?.[0]?.count ?? 0);
        } catch { return 0; }
      };

      const [incoming, receivedToday, qcPending, approvedWaiting, issueTasksPending] = await Promise.all([
        count('raw_material_orders', { status: { _eq: 'ordered' } }),
        count('raw_material_receipts'),
        count('batches', { status: { _eq: 'qc_pending' } }),
        count('batches', { status: { _eq: 'approved' } }),
        count('material_request_items', { issued_qty: { _eq: 0 } }),
      ]);

      setKpis([
        { label: 'Expected Incoming Orders', value: incoming, icon: IconTruckDelivery, color: 'blue', href: '/warehouse/incoming' },
        { label: 'Received Today', value: receivedToday, icon: IconTruckDelivery, color: 'green', href: '/warehouse/receive' },
        { label: 'Batches in Quarantine (QC Pending)', value: qcPending, icon: IconBarcode, color: 'orange', href: '/warehouse/batches' },
        { label: 'Approved — Waiting Putaway', value: approvedWaiting, icon: IconMapPin, color: 'teal', href: '/warehouse/putaway' },
        { label: 'Issue Tasks Pending', value: issueTasksPending, icon: IconTransferOut, color: 'grape', href: '/warehouse/issue' },
      ]);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <Stack gap="lg">
      <div>
        <Title order={2}>Warehouse Operation Dashboard</Title>
        <Text c="dimmed" size="sm">Physical warehouse operations — receiving, putaway, issue, and storage management.</Text>
      </div>
      {loading ? <Group justify="center" py="xl"><Loader /></Group> : (
        <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="md">
          {kpis.map((k) => (
            <Paper key={k.label} p="md" radius="md" withBorder>
              <Group justify="space-between" wrap="nowrap">
                <Stack gap={4}>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700} lineClamp={2}>{k.label}</Text>
                  <Title order={3}>{k.value ?? '—'}</Title>
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
