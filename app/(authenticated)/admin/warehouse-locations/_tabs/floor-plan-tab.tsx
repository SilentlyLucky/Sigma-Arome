'use client';

import { SimpleGrid, Paper, Group, Badge, Progress, Loader, Alert, Stack, Text } from '@mantine/core';
import { useEffect, useState } from 'react';
import { IconInfoCircle, IconBuildingWarehouse } from '@tabler/icons-react';

interface Warehouse { id: string; code: string; name: string | null }
interface Zone { id: string; code: string; name: string | null; warehouse_id: string }
interface Rack { id: string; code: string; zone_id: string }
interface Location {
  id: string;
  location_code: string;
  rack_id: string | null;
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

const PALETTE = ['blue', 'cyan', 'teal', 'indigo', 'orange', 'grape', 'violet', 'pink', 'lime', 'yellow'];

function zoneColor(index: number) {
  return PALETTE[index % PALETTE.length];
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

// Green (142°) → blue (217°) → red (0°) gradient based on occupancy %
function occupancyHue(pct: number): number {
  if (pct <= 0) return 142;
  if (pct <= 50) return Math.round(142 + (217 - 142) * (pct / 50)); // green → blue
  if (pct < 100) return Math.round(217 - (217) * ((pct - 50) / 50)); // blue → red
  return 0;
}
function occupancyColor(pct: number) {
  return `hsl(${occupancyHue(pct)}, 72%, 38%)`;
}
function occupancyBg(pct: number) {
  return `hsla(${occupancyHue(pct)}, 72%, 38%, 0.07)`;
}
function occupancyBorder(pct: number) {
  return `hsl(${occupancyHue(pct)}, 60%, 58%)`;
}

/**
 * Floor Plan tab — live visual map of all bins grouped Warehouse → Zone.
 * Loads each collection separately and joins client-side (same approach as the
 * Tree View) so the visual layout always matches the hierarchy.
 */
export function FloorPlanTab() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [racks, setRacks] = useState<Rack[]>([]);
  const [bins, setBins] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [wRes, zRes, rRes, bRes] = await Promise.all([
          fetch('/api/items/warehouses?fields[]=id&fields[]=code&fields[]=name&sort[]=code&limit=200', { cache: 'no-store' }),
          fetch('/api/items/zones?fields[]=id&fields[]=code&fields[]=name&fields[]=warehouse_id&sort[]=code&limit=500', { cache: 'no-store' }),
          fetch('/api/items/racks?fields[]=id&fields[]=code&fields[]=zone_id&sort[]=code&limit=1000', { cache: 'no-store' }),
          fetch(
            '/api/items/warehouse_locations?fields[]=id&fields[]=location_code&fields[]=rack_id' +
              '&fields[]=temperature_min&fields[]=temperature_max' +
              '&fields[]=capacity_kg&fields[]=current_occupancy_kg&fields[]=capacity_pcs&fields[]=current_occupancy_pcs' +
              '&fields[]=current_material_name&fields[]=current_material_id&fields[]=status&fields[]=is_active' +
              '&filter[is_active][_eq]=true&sort[]=location_code&limit=1000',
            { cache: 'no-store' }
          ),
        ]);
        setWarehouses((await wRes.json())?.data ?? []);
        setZones((await zRes.json())?.data ?? []);
        setRacks((await rRes.json())?.data ?? []);
        setBins((await bRes.json())?.data ?? []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const rackById = new Map(racks.map((r) => [r.id, r]));
  const zoneById = new Map(zones.map((z) => [z.id, z]));

  const unassigned: Location[] = [];

  const warehouseGroups = warehouses
    .map((wh) => {
      const whZones = zones
        .filter((z) => z.warehouse_id === wh.id)
        .map((zone) => {
          const zoneRackIds = new Set(racks.filter((r) => r.zone_id === zone.id).map((r) => r.id));
          const zoneBins = bins.filter((b) => b.rack_id && zoneRackIds.has(b.rack_id));
          return { zone, bins: zoneBins };
        })
        .filter((zg) => zg.bins.length > 0);
      return { warehouse: wh, zones: whZones };
    })
    .filter((wg) => wg.zones.length > 0);

  for (const b of bins) {
    const rack = b.rack_id ? rackById.get(b.rack_id) : undefined;
    const zone = rack ? zoneById.get(rack.zone_id) : undefined;
    if (!rack || !zone) unassigned.push(b);
  }

  if (loading) {
    return (
      <Group justify="center" py="xl">
        <Loader />
      </Group>
    );
  }

  return (
    <Stack gap="lg">
      <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
        Live view grouped by Warehouse → Zone. Each bin holds{' '}
        <strong>one material type only</strong>. Border colour shows fill level:{' '}
        <strong style={{ color: 'hsl(142,60%,36%)' }}>green = empty</strong> →{' '}
        <strong style={{ color: 'hsl(217,60%,46%)' }}>blue = half full</strong> →{' '}
        <strong style={{ color: 'hsl(0,65%,50%)' }}>red = full</strong>.
      </Alert>

      {warehouseGroups.length === 0 && unassigned.length === 0 ? (
        <Text c="dimmed" size="sm">
          No active locations found.
        </Text>
      ) : (
        <Stack gap="xl">
          {warehouseGroups.map((wg) => (
            <Paper key={wg.warehouse.id} p="md" radius="md" withBorder>
              <Group gap="xs" mb="sm">
                <IconBuildingWarehouse size={18} color="var(--mantine-color-blue-6)" />
                <Text fw={700} style={{ fontFamily: 'monospace' }}>
                  {wg.warehouse.code}
                </Text>
                <Text size="sm" c="dimmed">
                  {wg.warehouse.name}
                </Text>
              </Group>

              <Stack gap="md">
                {wg.zones.map(({ zone, bins: zoneBins }, idx) => {
                  const color = zoneColor(idx);
                  return (
                    <div key={zone.id}>
                      <Group gap="xs" mb={6}>
                        <Badge color={color} variant="filled" size="sm">
                          {zone.name ?? zone.code}
                        </Badge>
                        <Text size="xs" c="dimmed">
                          {zone.code} · {zoneBins.length} bin{zoneBins.length !== 1 ? 's' : ''}
                        </Text>
                      </Group>
                      <SimpleGrid cols={{ base: 2, sm: 3, md: 4, lg: 5 }} spacing="sm">
                        {zoneBins.map((loc) => {
                          const rack = loc.rack_id ? rackById.get(loc.rack_id) : undefined;
                          const isEmpty = !loc.current_material_id;
                          const { label: capacityLabel, pct: occupancyPct } = getCapacityDisplay(loc);
                          const border = occupancyBorder(isEmpty ? 0 : occupancyPct);
                          const bg = occupancyBg(isEmpty ? 0 : occupancyPct);
                          const barColor = occupancyColor(isEmpty ? 0 : occupancyPct);

                          return (
                            <Paper
                              key={loc.id}
                              p="sm"
                              radius="md"
                              style={{
                                border: `2px solid ${border}`,
                                background: bg,
                                boxShadow: `0 0 0 1px ${border}22, 0 2px 8px rgba(0,0,0,0.06)`,
                              }}
                            >
                              <Stack gap={5}>
                                <Group justify="space-between" wrap="nowrap" gap={4}>
                                  <Text size="sm" fw={700} style={{ fontFamily: 'monospace', color: '#1a2535' }}>
                                    {loc.location_code}
                                  </Text>
                                  {loc.temperature_min != null && loc.temperature_max != null && (
                                    <Badge size="xs" color="cyan" variant="light">
                                      {loc.temperature_min}–{loc.temperature_max}°C
                                    </Badge>
                                  )}
                                </Group>

                                {rack?.code && (
                                  <Text size="xs" c="dimmed" style={{ fontFamily: 'monospace' }}>
                                    {rack.code}
                                  </Text>
                                )}

                                {isEmpty ? (
                                  <Text size="xs" fw={600} style={{ color: 'hsl(142,60%,36%)' }}>Empty</Text>
                                ) : (
                                  <Text
                                    size="xs"
                                    c="dimmed"
                                    style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                  >
                                    {loc.current_material_name ?? 'Occupied'}
                                  </Text>
                                )}

                                <div style={{
                                  height: 5,
                                  borderRadius: 99,
                                  background: `${barColor}22`,
                                  overflow: 'hidden',
                                }}>
                                  <div style={{
                                    height: '100%',
                                    width: `${Math.min(occupancyPct, 100)}%`,
                                    borderRadius: 99,
                                    background: barColor,
                                    transition: 'width 0.3s ease',
                                  }} />
                                </div>
                                <Text size="xs" c="dimmed">
                                  {capacityLabel} · <strong>{occupancyPct}%</strong>
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
            </Paper>
          ))}

          {unassigned.length > 0 && (
            <Paper p="md" radius="md" withBorder>
              <Group gap="xs" mb="sm">
                <Badge color="gray" variant="filled" size="sm">
                  Unassigned
                </Badge>
                <Text size="xs" c="dimmed">
                  {unassigned.length} bin{unassigned.length !== 1 ? 's' : ''} with no rack/zone —
                  assign a Rack in the Bins tab
                </Text>
              </Group>
              <SimpleGrid cols={{ base: 2, sm: 3, md: 4, lg: 5 }} spacing="sm">
                {unassigned.map((loc) => (
                  <Paper key={loc.id} p="xs" radius="sm" withBorder style={{ opacity: 0.6 }}>
                    <Text size="sm" fw={700} style={{ fontFamily: 'monospace' }}>
                      {loc.location_code}
                    </Text>
                    <Text size="xs" c="dimmed">
                      No rack assigned
                    </Text>
                  </Paper>
                ))}
              </SimpleGrid>
            </Paper>
          )}
        </Stack>
      )}
    </Stack>
  );
}
