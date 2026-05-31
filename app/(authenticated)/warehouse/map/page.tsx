'use client';

import { Stack, Title, Text, SimpleGrid, Paper, Group, Badge, Progress, Loader, Alert } from '@mantine/core';
import { useEffect, useState } from 'react';
import { IconInfoCircle } from '@tabler/icons-react';

interface Location {
  id: string;
  location_code: string;
  zone: string;
  temperature_min: number | null;
  temperature_max: number | null;
  capacity_kg: number | null;
  current_occupancy_kg: number;
  capacity_pcs: number | null;
  current_occupancy_pcs: number;
  current_material_name: string | null;
  current_material_id: string | null;
  status: string;
  is_active: boolean;
}

const ZONE_COLORS: Record<string, string> = {
  receiving_quarantine: 'orange',
  raw_material: 'blue',
  cold_storage: 'cyan',
  staging: 'yellow',
  finished_goods: 'green',
  production: 'violet',
  packaging_components: 'grape',
};

const ZONE_LABELS: Record<string, string> = {
  receiving_quarantine: 'Receiving / Quarantine',
  raw_material: 'Raw Material Storage',
  cold_storage: 'Cold Storage',
  staging: 'Staging',
  finished_goods: 'Finished Goods',
  production: 'Production',
  packaging_components: 'Packaging Components',
};

const ZONE_ORDER = [
  'receiving_quarantine',
  'raw_material',
  'cold_storage',
  'packaging_components',
  'staging',
  'finished_goods',
  'production',
];

/**
 * Returns the capacity display string and occupancy percentage for a location.
 * - Packaging zones: "8,000 / 50,000 pcs"
 * - Cold storage / liquid zones: "450 / 1,000 L"
 * - Solid/powder zones: "800 / 2,000 kg"
 */
function getCapacityDisplay(loc: Location): { label: string; pct: number; unit: string } {
  const zone = loc.zone;

  if (zone === 'packaging_components') {
    const cap = loc.capacity_pcs ?? 0;
    const occ = loc.current_occupancy_pcs ?? 0;
    const pct = cap > 0 ? Math.round((occ / cap) * 100) : 0;
    return {
      label: `${occ.toLocaleString()} / ${cap.toLocaleString()} pcs`,
      pct,
      unit: 'pcs',
    };
  }

  if (zone === 'cold_storage') {
    // Cold storage typically holds liquids — display in L
    const cap = loc.capacity_kg ?? 0;
    const occ = loc.current_occupancy_kg ?? 0;
    const pct = cap > 0 ? Math.round((occ / cap) * 100) : 0;
    return {
      label: `${occ.toLocaleString()} / ${cap.toLocaleString()} L`,
      pct,
      unit: 'L',
    };
  }

  // Default: kg (raw_material, finished_goods, staging, etc.)
  const cap = loc.capacity_kg ?? 0;
  const occ = loc.current_occupancy_kg ?? 0;
  const pct = cap > 0 ? Math.round((occ / cap) * 100) : 0;
  return {
    label: `${occ.toLocaleString()} / ${cap.toLocaleString()} kg`,
    pct,
    unit: 'kg',
  };
}

export default function WarehouseMapPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(
      '/api/items/warehouse_locations' +
      '?fields[]=id&fields[]=location_code&fields[]=zone' +
      '&fields[]=temperature_min&fields[]=temperature_max' +
      '&fields[]=capacity_kg&fields[]=current_occupancy_kg' +
      '&fields[]=capacity_pcs&fields[]=current_occupancy_pcs' +
      '&fields[]=current_material_name&fields[]=current_material_id' +
      '&fields[]=status&fields[]=is_active&limit=200&sort[]=zone&sort[]=location_code'
    )
      .then(r => r.json())
      .then(d => setLocations(d?.data ?? []))
      .finally(() => setLoading(false));
  }, []);

  // Include any zones that appear in the data but aren't in ZONE_ORDER
  const allZones = [
    ...ZONE_ORDER,
    ...locations.map(l => l.zone).filter(z => !ZONE_ORDER.includes(z)),
  ].filter((z, i, arr) => arr.indexOf(z) === i);

  const byZone = allZones.reduce<Record<string, Location[]>>((acc, zone) => {
    acc[zone] = locations.filter(l => l.zone === zone);
    return acc;
  }, {});

  return (
    <Stack gap="lg">
      <div>
        <Title order={2}>Warehouse Floor Plan</Title>
        <Text c="dimmed" size="sm">
          Live view of all storage locations — shows current material, occupancy, and availability at a glance.
        </Text>
      </div>

      <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
        Each location holds <strong>one material type only</strong> (single-material rule).
        Green = empty · Coloured = occupied · Red border = full
      </Alert>

      {loading ? (
        <Group justify="center" py="xl"><Loader /></Group>
      ) : (
        <Stack gap="xl">
          {allZones.map(zone => {
            const locs = byZone[zone];
            if (!locs || locs.length === 0) return null;
            return (
              <div key={zone}>
                <Group gap="xs" mb="sm">
                  <Badge color={ZONE_COLORS[zone] ?? 'gray'} variant="filled" size="sm">
                    {ZONE_LABELS[zone] ?? zone.replace(/_/g, ' ')}
                  </Badge>
                  <Text size="xs" c="dimmed">{locs.length} location{locs.length !== 1 ? 's' : ''}</Text>
                </Group>
                <SimpleGrid cols={{ base: 2, sm: 3, md: 4, lg: 5 }} spacing="sm">
                  {locs.map(loc => {
                    const isEmpty = !loc.current_material_id;
                    const { label: capacityLabel, pct: occupancyPct } = getCapacityDisplay(loc);
                    const isFull = occupancyPct >= 100;
                    const isInactive = !loc.is_active;

                    let borderColor = 'var(--mantine-color-green-4)';
                    let bgHint = undefined as string | undefined;
                    if (isInactive) {
                      borderColor = 'var(--mantine-color-gray-4)';
                      bgHint = 'var(--mantine-color-gray-0)';
                    } else if (isFull) {
                      borderColor = 'var(--mantine-color-red-4)';
                    } else if (!isEmpty) {
                      borderColor = `var(--mantine-color-${ZONE_COLORS[zone] ?? 'blue'}-4)`;
                    }

                    return (
                      <Paper
                        key={loc.id}
                        p="xs"
                        radius="sm"
                        withBorder
                        style={{ borderColor, background: bgHint, opacity: isInactive ? 0.5 : 1 }}
                      >
                        <Stack gap={4}>
                          <Group justify="space-between" wrap="nowrap">
                            <Text size="sm" fw={700} style={{ fontFamily: 'monospace' }}>
                              {loc.location_code}
                            </Text>
                            {loc.temperature_min != null && loc.temperature_max != null && (
                              <Badge size="xs" color="cyan" variant="light">
                                {loc.temperature_min}–{loc.temperature_max}°C
                              </Badge>
                            )}
                          </Group>

                          {isEmpty ? (
                            <Badge size="xs" color="green" variant="light">Empty</Badge>
                          ) : (
                            <Text size="xs" c="dimmed" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {loc.current_material_name ?? 'Unknown material'}
                            </Text>
                          )}

                          <Progress
                            value={occupancyPct}
                            size="xs"
                            color={isFull ? 'red' : isEmpty ? 'green' : ZONE_COLORS[zone] ?? 'blue'}
                          />
                          <Text size="xs" c="dimmed">
                            {capacityLabel} ({occupancyPct}%)
                          </Text>
                        </Stack>
                      </Paper>
                    );
                  })}
                </SimpleGrid>
              </div>
            );
          })}
        </Stack>
      )}
    </Stack>
  );
}
