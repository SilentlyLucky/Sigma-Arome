'use client';

import { Stack, Group, Text, Loader, Paper, Badge, Box, UnstyledButton, Table, Alert } from '@mantine/core';
import { useEffect, useState, useCallback } from 'react';
import {
  IconChevronRight,
  IconChevronDown,
  IconBuildingWarehouse,
  IconViewfinder,
  IconStack2,
  IconBox,
  IconInfoCircle,
} from '@tabler/icons-react';

interface Warehouse { id: string; code: string; name: string }
interface Zone { id: string; code: string; name: string | null; warehouse_id: string }
interface Rack { id: string; code: string; zone_id: string }
interface Bin {
  id: string;
  location_code: string;
  rack_id: string | null;
  capacity_kg: number | null;
  current_occupancy_kg: number | null;
  capacity_pcs: number | null;
  current_occupancy_pcs: number | null;
}
interface InventoryRow {
  id: string;
  batch_number: string;
  qty: number;
  unit: string;
  status: string;
  material_name: string;
}

function Expander({ open }: { open: boolean }) {
  return open ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />;
}

export function TreeViewTab() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [racks, setRacks] = useState<Rack[]>([]);
  const [bins, setBins] = useState<Bin[]>([]);
  const [loading, setLoading] = useState(true);

  const [openWh, setOpenWh] = useState<Set<string>>(new Set());
  const [openZone, setOpenZone] = useState<Set<string>>(new Set());
  const [openRack, setOpenRack] = useState<Set<string>>(new Set());

  // Bin inventory drill-down
  const [selectedBin, setSelectedBin] = useState<Bin | null>(null);
  const [binInventory, setBinInventory] = useState<InventoryRow[]>([]);
  const [invLoading, setInvLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [wRes, zRes, rRes, bRes] = await Promise.all([
          fetch('/api/items/warehouses?fields[]=id&fields[]=code&fields[]=name&sort[]=code&limit=200', { cache: 'no-store' }),
          fetch('/api/items/zones?fields[]=id&fields[]=code&fields[]=name&fields[]=warehouse_id&sort[]=code&limit=500', { cache: 'no-store' }),
          fetch('/api/items/racks?fields[]=id&fields[]=code&fields[]=zone_id&sort[]=code&limit=1000', { cache: 'no-store' }),
          fetch(
            '/api/items/warehouse_locations?fields[]=id&fields[]=location_code&fields[]=rack_id' +
              '&fields[]=capacity_kg&fields[]=current_occupancy_kg&fields[]=capacity_pcs&fields[]=current_occupancy_pcs' +
              '&sort[]=location_code&limit=1000',
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

  const toggle = (set: Set<string>, setter: (s: Set<string>) => void, id: string) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setter(next);
  };

  const loadBinInventory = useCallback(async (bin: Bin) => {
    setSelectedBin(bin);
    setInvLoading(true);
    setBinInventory([]);
    try {
      const res = await fetch(
        `/api/items/batches?filter[current_location_id][_eq]=${bin.id}` +
          '&fields[]=id&fields[]=batch_number&fields[]=qty&fields[]=unit&fields[]=status&fields[]=material_id.name&limit=200',
        { cache: 'no-store' }
      );
      const data = (await res.json())?.data ?? [];
      setBinInventory(
        data.map((b: Record<string, unknown>) => ({
          id: String(b.id ?? ''),
          batch_number: String(b.batch_number ?? ''),
          qty: Number(b.qty ?? 0),
          unit: String(b.unit ?? ''),
          status: String(b.status ?? ''),
          material_name:
            (b.material_id && typeof b.material_id === 'object'
              ? String((b.material_id as Record<string, unknown>).name ?? '')
              : '') || '—',
        }))
      );
    } finally {
      setInvLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <Group justify="center" py="xl">
        <Loader />
      </Group>
    );
  }

  return (
    <Group align="flex-start" gap="lg" wrap="nowrap" style={{ width: '100%' }}>
      <Paper p="md" withBorder style={{ flex: 1, minWidth: 0 }}>
        <Text fw={600} mb="sm">
          Hierarchy
        </Text>
        <Stack gap={2}>
          {warehouses.map((wh) => {
            const whZones = zones.filter((z) => z.warehouse_id === wh.id);
            const whOpen = openWh.has(wh.id);
            return (
              <Box key={wh.id}>
                <UnstyledButton
                  onClick={() => toggle(openWh, setOpenWh, wh.id)}
                  style={{ display: 'block', width: '100%', padding: '4px 6px', borderRadius: 4 }}
                >
                  <Group gap={6} wrap="nowrap">
                    <Expander open={whOpen} />
                    <IconBuildingWarehouse size={16} color="var(--mantine-color-blue-6)" />
                    <Text size="sm" fw={600} style={{ fontFamily: 'monospace' }}>
                      {wh.code}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {wh.name}
                    </Text>
                  </Group>
                </UnstyledButton>

                {whOpen &&
                  whZones.map((z) => {
                    const zRacks = racks.filter((r) => r.zone_id === z.id);
                    const zOpen = openZone.has(z.id);
                    return (
                      <Box key={z.id} pl="lg">
                        <UnstyledButton
                          onClick={() => toggle(openZone, setOpenZone, z.id)}
                          style={{ display: 'block', width: '100%', padding: '4px 6px', borderRadius: 4 }}
                        >
                          <Group gap={6} wrap="nowrap">
                            <Expander open={zOpen} />
                            <IconViewfinder size={15} color="var(--mantine-color-cyan-6)" />
                            <Text size="sm" style={{ fontFamily: 'monospace' }}>
                              {z.code}
                            </Text>
                          </Group>
                        </UnstyledButton>

                        {zOpen &&
                          zRacks.map((r) => {
                            const rBins = bins.filter((b) => b.rack_id === r.id);
                            const rOpen = openRack.has(r.id);
                            return (
                              <Box key={r.id} pl="lg">
                                <UnstyledButton
                                  onClick={() => toggle(openRack, setOpenRack, r.id)}
                                  style={{ display: 'block', width: '100%', padding: '4px 6px', borderRadius: 4 }}
                                >
                                  <Group gap={6} wrap="nowrap">
                                    <Expander open={rOpen} />
                                    <IconStack2 size={15} color="var(--mantine-color-grape-6)" />
                                    <Text size="sm" style={{ fontFamily: 'monospace' }}>
                                      {r.code}
                                    </Text>
                                  </Group>
                                </UnstyledButton>

                                {rOpen &&
                                  rBins.map((b) => {
                                    const isSel = selectedBin?.id === b.id;
                                    return (
                                      <Box key={b.id} pl="xl">
                                        <UnstyledButton
                                          onClick={() => loadBinInventory(b)}
                                          style={{
                                            display: 'block',
                                            width: '100%',
                                            padding: '4px 6px',
                                            borderRadius: 4,
                                            background: isSel ? 'var(--mantine-color-blue-0)' : undefined,
                                          }}
                                        >
                                          <Group gap={6} wrap="nowrap">
                                            <IconBox size={14} color="var(--mantine-color-teal-6)" />
                                            <Text size="sm" style={{ fontFamily: 'monospace' }}>
                                              {b.location_code}
                                            </Text>
                                          </Group>
                                        </UnstyledButton>
                                      </Box>
                                    );
                                  })}
                                {rOpen && rBins.length === 0 && (
                                  <Text size="xs" c="dimmed" pl="xl" py={2}>
                                    No bins
                                  </Text>
                                )}
                              </Box>
                            );
                          })}
                        {zOpen && zRacks.length === 0 && (
                          <Text size="xs" c="dimmed" pl="lg" py={2}>
                            No racks
                          </Text>
                        )}
                      </Box>
                    );
                  })}
              </Box>
            );
          })}
          {warehouses.length === 0 && (
            <Text size="sm" c="dimmed">
              No warehouses defined yet.
            </Text>
          )}
        </Stack>
      </Paper>

      <Paper p="md" withBorder style={{ flex: 1, minWidth: 0 }}>
        {!selectedBin ? (
          <Alert icon={<IconInfoCircle size={16} />} color="gray" variant="light">
            Click a bin in the tree to view the inventory stored there.
          </Alert>
        ) : (
          <Stack gap="sm">
            <Group gap="xs">
              <IconBox size={18} color="var(--mantine-color-teal-6)" />
              <Text fw={600} style={{ fontFamily: 'monospace' }}>
                {selectedBin.location_code}
              </Text>
            </Group>
            {invLoading ? (
              <Loader size="sm" />
            ) : binInventory.length === 0 ? (
              <Text size="sm" c="dimmed">
                This bin is empty.
              </Text>
            ) : (
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Batch</Table.Th>
                    <Table.Th>Material</Table.Th>
                    <Table.Th>Qty</Table.Th>
                    <Table.Th>Status</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {binInventory.map((row) => (
                    <Table.Tr key={row.id}>
                      <Table.Td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                        {row.batch_number}
                      </Table.Td>
                      <Table.Td>{row.material_name}</Table.Td>
                      <Table.Td>
                        {row.qty} {row.unit}
                      </Table.Td>
                      <Table.Td>
                        <Badge size="sm" variant="light">
                          {row.status}
                        </Badge>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            )}
          </Stack>
        )}
      </Paper>
    </Group>
  );
}
