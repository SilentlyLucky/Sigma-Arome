'use client';

import { SimpleGrid, Paper, Text, Group, Progress, Loader, Stack, Badge, Alert } from '@mantine/core';
import { useEffect, useState } from 'react';
import { IconInfoCircle } from '@tabler/icons-react';

interface Location {
  id: string;
  zone: string;
  capacity_kg: number | null;
  current_occupancy_kg: number | null;
  capacity_pcs: number | null;
  current_occupancy_pcs: number | null;
  is_active: boolean;
}

interface Batch {
  id: string;
  status: string;
  current_location_id: string | null;
}

interface Metrics {
  totalCapacityKg: number;
  occupancyKg: number;
  totalCapacityPcs: number;
  occupancyPcs: number;
  binCount: number;
  inventoryCount: number;
  released: number;
  hold: number;
}

const RELEASED_STATUSES = ['approved', 'storage_assigned', 'stored_available'];
const HOLD_STATUSES = ['qc_pending', 'under_qc', 'hold'];

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Paper p="md" radius="md" withBorder>
      <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
        {label}
      </Text>
      <Text size="xl" fw={700} mt={4}>
        {value}
      </Text>
      {sub && (
        <Text size="xs" c="dimmed" mt={2}>
          {sub}
        </Text>
      )}
    </Paper>
  );
}

export function OverviewTab() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [locRes, batchRes] = await Promise.all([
          fetch(
            '/api/items/warehouse_locations?filter[is_active][_eq]=true' +
              '&fields[]=id&fields[]=zone&fields[]=capacity_kg&fields[]=current_occupancy_kg' +
              '&fields[]=capacity_pcs&fields[]=current_occupancy_pcs&fields[]=is_active&limit=500',
            { cache: 'no-store' }
          ),
          fetch(
            '/api/items/batches?fields[]=id&fields[]=status&fields[]=current_location_id&limit=1000',
            { cache: 'no-store' }
          ),
        ]);
        const locations: Location[] = (await locRes.json())?.data ?? [];
        const batches: Batch[] = (await batchRes.json())?.data ?? [];

        let totalCapacityKg = 0;
        let occupancyKg = 0;
        let totalCapacityPcs = 0;
        let occupancyPcs = 0;
        for (const l of locations) {
          totalCapacityKg += l.capacity_kg ?? 0;
          occupancyKg += l.current_occupancy_kg ?? 0;
          totalCapacityPcs += l.capacity_pcs ?? 0;
          occupancyPcs += l.current_occupancy_pcs ?? 0;
        }

        const stored = batches.filter((b) => !!b.current_location_id);
        const released = batches.filter((b) => RELEASED_STATUSES.includes(b.status)).length;
        const hold = batches.filter((b) => HOLD_STATUSES.includes(b.status)).length;

        setMetrics({
          totalCapacityKg,
          occupancyKg,
          totalCapacityPcs,
          occupancyPcs,
          binCount: locations.length,
          inventoryCount: stored.length,
          released,
          hold,
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <Group justify="center" py="xl">
        <Loader />
      </Group>
    );
  }
  if (!metrics) return null;

  const availableKg = Math.max(0, metrics.totalCapacityKg - metrics.occupancyKg);
  const utilizationKg =
    metrics.totalCapacityKg > 0
      ? Math.round((metrics.occupancyKg / metrics.totalCapacityKg) * 100)
      : 0;
  const utilizationPcs =
    metrics.totalCapacityPcs > 0
      ? Math.round((metrics.occupancyPcs / metrics.totalCapacityPcs) * 100)
      : 0;

  const fmt = (n: number) => n.toLocaleString();

  return (
    <Stack gap="lg">
      <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
        Capacity figures are aggregated across all active bins. Weight (kg) is used for raw
        materials and finished goods; pieces (pcs) for packaging components.
      </Alert>

      <div>
        <Text fw={600} mb="xs">
          Weight Capacity (kg)
        </Text>
        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
          <StatCard label="Total Capacity" value={`${fmt(metrics.totalCapacityKg)} kg`} />
          <StatCard label="Used Space" value={`${fmt(metrics.occupancyKg)} kg`} />
          <StatCard label="Space Still Available" value={`${fmt(availableKg)} kg`} />
          <StatCard label="Space Used" value={`${utilizationKg}%`} />
        </SimpleGrid>
        <Progress
          value={utilizationKg}
          mt="sm"
          size="lg"
          radius="sm"
          color={utilizationKg >= 90 ? 'red' : utilizationKg >= 70 ? 'orange' : 'teal'}
        />
      </div>

      {metrics.totalCapacityPcs > 0 && (
        <div>
          <Text fw={600} mb="xs">
            Packaging Capacity (pcs)
          </Text>
          <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
            <StatCard label="Total Capacity" value={`${fmt(metrics.totalCapacityPcs)} pcs`} />
            <StatCard label="Used Space" value={`${fmt(metrics.occupancyPcs)} pcs`} />
            <StatCard
              label="Space Still Available"
              value={`${fmt(Math.max(0, metrics.totalCapacityPcs - metrics.occupancyPcs))} pcs`}
            />
            <StatCard label="Space Used" value={`${utilizationPcs}%`} />
          </SimpleGrid>
        </div>
      )}

      <div>
        <Text fw={600} mb="xs">
          Inventory
        </Text>
        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
          <StatCard label="Active Bins" value={fmt(metrics.binCount)} />
          <StatCard label="Stored Batches" value={fmt(metrics.inventoryCount)} sub="batches currently in bins" />
          <StatCard label="Ready to Use" value={fmt(metrics.released)} />
          <StatCard label="Waiting or On Hold" value={fmt(metrics.hold)} />
        </SimpleGrid>
      </div>
    </Stack>
  );
}
