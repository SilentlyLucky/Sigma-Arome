'use client';

import {
  SimpleGrid,
  Paper,
  Text,
  Title,
  Group,
  Stack,
  ThemeIcon,
  Badge,
  Loader,
  Anchor,
} from '@mantine/core';
import {
  IconShoppingCart,
  IconTruckDelivery,
  IconFlask,
  IconCheck,
  IconAlertTriangle,
  IconClock,
  IconBuildingFactory,
  IconClipboardList,
  IconPackage,
} from '@tabler/icons-react';
import { useEffect, useState } from 'react';

/**
 * PPIC Dashboard
 * KPIs per PRD Section 17.3
 */

interface KPI {
  label: string;
  value: number | null;
  icon: typeof IconShoppingCart;
  color: string;
  href?: string;
}

export default function PPICDashboard() {
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchKPIs() {
      setLoading(true);
      const results: KPI[] = [];

      const counts = await fetch('/api/batch-counts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          counts: [
            { key: 'ordersWaiting', collection: 'raw_material_orders', filter: { status: { _eq: 'ordered' } } },
            { key: 'ordersPartial', collection: 'raw_material_orders', filter: { status: { _eq: 'partially_received' } } },
            { key: 'pendingQC', collection: 'raw_material_orders', filter: { status: { _eq: 'received' } } },
            { key: 'approved', collection: 'raw_material_orders', filter: { status: { _eq: 'closed' } } },
            { key: 'onHold', collection: 'raw_material_orders', filter: { status: { _eq: 'draft' } } },
            { key: 'requestsPending', collection: 'material_requests', filter: { status: { _eq: 'pending' } } },
            { key: 'prodWaiting', collection: 'production_orders', filter: { status: { _in: ['draft', 'material_checked', 'material_requested', 'waiting_issue'] } } },
            { key: 'prodInProgress', collection: 'production_orders', filter: { status: { _eq: 'in_production' } } },
          ],
        }),
      }).then(async (res) => (res.ok ? ((await res.json())?.counts ?? {}) : {})).catch(() => ({}));
      const ordersWaiting = Number(counts.ordersWaiting ?? 0);
      const ordersPartial = Number(counts.ordersPartial ?? 0);
      const pendingQC = Number(counts.pendingQC ?? 0);
      const approved = Number(counts.approved ?? 0);
      const onHold = Number(counts.onHold ?? 0);
      const requestsPending = Number(counts.requestsPending ?? 0);
      const prodWaiting = Number(counts.prodWaiting ?? 0);
      const prodInProgress = Number(counts.prodInProgress ?? 0);

      results.push(
        { label: 'Raw Materials Waiting to Arrive', value: ordersWaiting, icon: IconTruckDelivery, color: 'orange', href: '/ppic/orders' },
        { label: 'Orders Partially Received', value: ordersPartial, icon: IconShoppingCart, color: 'yellow', href: '/ppic/orders' },
        { label: 'Materials Waiting for QC', value: pendingQC, icon: IconFlask, color: 'blue', href: '/ppic/readiness' },
        { label: 'Materials Approved for Storage', value: approved, icon: IconCheck, color: 'green', href: '/ppic/readiness' },
        { label: 'Materials on Hold', value: onHold, icon: IconAlertTriangle, color: 'red' },
        { label: 'Requests Waiting for Logistics', value: requestsPending, icon: IconClipboardList, color: 'grape', href: '/ppic/requests' },
        { label: 'Production Waiting for Materials', value: prodWaiting, icon: IconClock, color: 'indigo', href: '/ppic/production' },
        { label: 'Production In Progress', value: prodInProgress, icon: IconBuildingFactory, color: 'teal', href: '/ppic/production' },
      );

      setKpis(results);
      setLoading(false);
    }
    fetchKPIs();
  }, []);

  return (
    <Stack gap="lg">
      <div>
        <Title order={2}>PPIC Planning Dashboard</Title>
        <Text c="dimmed" size="sm">
          Plan raw material orders, product formulas, production schedules, and material availability.
        </Text>
      </div>

      {loading ? (
        <Group justify="center" py="xl"><Loader /></Group>
      ) : (
        <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="md">
          {kpis.map((kpi) => (
            <Paper key={kpi.label} p="md" radius="md" withBorder>
              <Group justify="space-between" wrap="nowrap">
                <Stack gap={4}>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700} lineClamp={1}>
                    {kpi.label}
                  </Text>
                  <Title order={3}>{kpi.value ?? '—'}</Title>
                </Stack>
                <ThemeIcon size="xl" radius="md" variant="light" color={kpi.color}>
                  <kpi.icon size={24} />
                </ThemeIcon>
              </Group>
              {kpi.href && (
                <Anchor href={kpi.href} size="xs" c="dimmed" mt={4} display="block">View details →</Anchor>
              )}
            </Paper>
          ))}
        </SimpleGrid>
      )}
    </Stack>
  );
}
