'use client';

import { Stack, Title, Text, SimpleGrid, Paper, Group, Badge, Progress, Loader, Alert } from '@mantine/core';
import { useEffect, useState } from 'react';
import { IconInfoCircle } from '@tabler/icons-react';

interface ZoneRef {
  id: string;
  code: string;
  name: string | null;
}

interface Location {
  id: string;
  location_code: string;
  rack_id: { zone_id: ZoneRef | null } | null;
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

const PALETTE = ['blue', 'cyan', 'teal', 'green', 'orange', 'grape', 'violet', 'pink', 'red', 'yellow'];

function zoneColor(index: number) {
  return PALETTE[index % PALETTE.length];
}

function resolveZone(loc: Location): ZoneRef | null {
  return loc.rack_id?.zone_id ?? null;
}

function getCapacityDisplay(loc: Location): { label: string; pct: number } {
  const usesPcs = (loc.capacity_pcs ?? 0) > 0;
  if (usesPcs) {
    const cap = loc.capacity_pcs ?? 0;
    const occ = loc.current_occupancy_pcs ?? 0;
    const pct = cap > 0 ? Math.round((occ / cap) * 100) : 0;
    return { label: `${occ.toLocaleString()} / ${cap.toLocaleString()} pcs`, pct };
  }
  const cap = loc.capacity_kg ?? 0;
  const occ = loc.current_occupancy_kg ?? 0;
  const pct = cap > 0 ? Math.round((occ / cap) * 100) : 0;
  return { label: `${occ.toLocaleString()} / ${cap.toLocaleString()} kg`, pct };
}

export default function WarehouseMapPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(
      '/api/items/warehouse_locations' +
      '?fields[]=id&fields[]=location_code' +
      '&fields[]=rack_id.zone_id.id' +
      '&fields[]=rack_id.zone_id.code' +
      '&fields[]=rack_id.zone_id.name' +
      '&fields[]=temperature_min&fields[]=temperature_max' +
      '&fields[]=capacity_kg&fields[]=current_occupancy_kg' +
      '&fields[]=capacity_pcs&fields[]=current_occupancy_pcs' +
      '&fields[]=current_material_name&fields[]=current_material_id' +
      '&fields[]=status&fields[]=is_active' +
      '&filter[is_active][_eq]=true&limit=500&sort[]=location_code'
    )
      .then(r => r.json())
      .then(d => setLocations(d?.data ?? []))
      .finally(() => setLoading(false));
  }, []);

  const zoneMap = new Map<string, { zone: ZoneRef; bins: Location[] }>();
  for (const loc of locations) {
    const zone = resolveZone(loc);
    if (!zone) continue;
    if (!zoneMap.has(zone.id)) zoneMap.set(zone.id, { zone, bins: [] });
    zoneMap.get(zone.id)!.bins.push(loc);
  }

  const sortedZones = Array.from(zoneMap.values()).sort((a, b) =>
    a.zone.code.localeCompare(b.zone.code)
  );

  const unassigned = locations.filter(loc => !resolveZone(loc));

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
          {sortedZones.map(({ zone, bins }, idx) => (
            <div key={zone.id}>
              <Group gap="xs" mb="sm">
                <Badge color={zoneColor(idx)} variant="filled" size="sm">
                  {zone.name ?? zone.code}
                </Badge>
                <Text size="xs" c="dimmed">
                  {zone.code} · {bins.length} location{bins.length !== 1 ? 's' : ''}
                </Text>
              </Group>
              <SimpleGrid cols={{ base: 2, sm: 3, md: 4, lg: 5 }} spacing="sm">
                {bins.map(loc => {
                  const isEmpty = !loc.current_material_id;
                  const { label: capacityLabel, pct: occupancyPct } = getCapacityDisplay(loc);
                  const isFull = occupancyPct >= 100;
                  const isInactive = !loc.is_active;
                  const color = zoneColor(idx);

                  let borderColor = 'var(--mantine-color-green-4)';
                  let bgHint: string | undefined;
                  if (isInactive) {
                    borderColor = 'var(--mantine-color-gray-4)';
                    bgHint = 'var(--mantine-color-gray-0)';
                  } else if (isFull) {
                    borderColor = 'var(--mantine-color-red-4)';
                  } else if (!isEmpty) {
                    borderColor = `var(--mantine-color-${color}-4)`;
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
                          color={isFull ? 'red' : isEmpty ? 'green' : color}
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
          ))}

          {unassigned.length > 0 && (
            <div>
              <Group gap="xs" mb="sm">
                <Badge color="gray" variant="filled" size="sm">Unassigned</Badge>
                <Text size="xs" c="dimmed">{unassigned.length} location{unassigned.length !== 1 ? 's' : ''} with no zone</Text>
              </Group>
              <SimpleGrid cols={{ base: 2, sm: 3, md: 4, lg: 5 }} spacing="sm">
                {unassigned.map(loc => (
                  <Paper key={loc.id} p="xs" radius="sm" withBorder style={{ opacity: 0.6 }}>
                    <Text size="sm" fw={700} style={{ fontFamily: 'monospace' }}>{loc.location_code}</Text>
                    <Text size="xs" c="dimmed">No zone assigned</Text>
                  </Paper>
                ))}
              </SimpleGrid>
            </div>
          )}

          {sortedZones.length === 0 && !loading && (
            <Text c="dimmed" size="sm">No active locations found.</Text>
          )}
        </Stack>
      )}
    </Stack>
  );
}
