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

      // Helper to count items with filter
      const countItems = async (collection: string, filter?: Record<string, unknown>): Promise<number> => {
        try {
          const params = new URLSearchParams({ 'aggregate[count]': '*' });
          if (filter) params.set('filter', JSON.stringify(filter));
          const res = await fetch(`/api/items/${collection}?${params.toString()}`);
          if (!res.ok) return 0;
          const data = await res.json();
          return Number(data?.data?.[0]?.count ?? 0);
        } catch { return 0; }
      };

      const [ordersWaiting, ordersPartial, pendingQC, approved, onHold, requestsPending, prodWaiting, prodInProgress] = await Promise.all([
        countItems('raw_material_orders', { status: { _eq: 'ordered' } }),
        countItems('raw_material_orders', { status: { _eq: 'partially_received' } }),
        countItems('raw_material_orders', { status: { _eq: 'received' } }), // proxy for QC pending
        countItems('raw_material_orders', { status: { _eq: 'closed' } }), // proxy for approved
        countItems('raw_material_orders', { status: { _eq: 'draft' } }), // placeholder
        countItems('material_requests', { status: { _eq: 'pending' } }),
        countItems('production_orders', { status: { _in: ['draft', 'material_checked', 'material_requested', 'waiting_issue'] } }),
        countItems('production_orders', { status: { _eq: 'in_production' } }),
      ]);

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
