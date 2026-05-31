'use client';

import {
  Stack,
  Group,
  Text,
  Loader,
  Table,
  Badge,
  TextInput,
  Alert,
  ScrollArea,
} from '@mantine/core';
import { useEffect, useState, useMemo } from 'react';
import { IconSearch, IconInfoCircle } from '@tabler/icons-react';
import { SelectDropdown } from '@/components/ui/select-dropdown';

interface Row {
  id: string;
  batch_number: string;
  material_name: string;
  material_code: string;
  qty: number;
  unit: string;
  weight_kg: number | null;
  status: string;
  hazard_name: string;
  full_path: string;
  zone: string;
  warehouse_code: string;
  date_updated: string | null;
}

const RELEASED = ['approved', 'storage_assigned', 'stored_available'];
const HOLD = ['qc_pending', 'under_qc', 'hold'];

function qcBucket(status: string): 'released' | 'hold' | 'other' {
  if (RELEASED.includes(status)) return 'released';
  if (HOLD.includes(status)) return 'hold';
  return 'other';
}

export function InventoryViewTab() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState<string>('');
  const [hazardFilter, setHazardFilter] = useState<string>('');
  const [qcFilter, setQcFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    const load = async () => {
      try {
        // Build location → full path map
        const [whRes, zRes, rRes, bRes, hazRes] = await Promise.all([
          fetch('/api/items/warehouses?fields[]=id&fields[]=code&limit=200', { cache: 'no-store' }),
          fetch('/api/items/zones?fields[]=id&fields[]=code&fields[]=warehouse_id&limit=500', { cache: 'no-store' }),
          fetch('/api/items/racks?fields[]=id&fields[]=code&fields[]=zone_id&limit=1000', { cache: 'no-store' }),
          fetch(
            '/api/items/warehouse_locations?fields[]=id&fields[]=location_code&fields[]=rack_id&fields[]=zone&limit=1000',
            { cache: 'no-store' }
          ),
          fetch('/api/items/hazard_classes?fields[]=id&fields[]=name&limit=200', { cache: 'no-store' }),
        ]);
        const warehouses = (await whRes.json())?.data ?? [];
        const zones = (await zRes.json())?.data ?? [];
        const racks = (await rRes.json())?.data ?? [];
        const locs = (await bRes.json())?.data ?? [];
        const hazards = (await hazRes.json())?.data ?? [];

        const whById = new Map<string, { code: string }>(warehouses.map((w: Record<string, unknown>) => [String(w.id), { code: String(w.code) }]));
        const zoneById = new Map<string, { code: string; warehouse_id: string }>(
          zones.map((z: Record<string, unknown>) => [String(z.id), { code: String(z.code), warehouse_id: String(z.warehouse_id ?? '') }])
        );
        const rackById = new Map<string, { code: string; zone_id: string }>(
          racks.map((r: Record<string, unknown>) => [String(r.id), { code: String(r.code), zone_id: String(r.zone_id ?? '') }])
        );
        const hazById = new Map<string, string>(hazards.map((h: Record<string, unknown>) => [String(h.id), String(h.name)]));

        const locInfo = new Map<string, { full_path: string; zone: string; warehouse_code: string }>();
        for (const l of locs) {
          const rack = l.rack_id ? rackById.get(String(l.rack_id)) : undefined;
          const zone = rack ? zoneById.get(rack.zone_id) : undefined;
          const wh = zone ? whById.get(zone.warehouse_id) : undefined;
          const parts = [wh?.code, zone?.code, rack?.code, l.location_code].filter(Boolean);
          locInfo.set(String(l.id), {
            full_path: parts.join('/'),
            zone: String(l.zone ?? ''),
            warehouse_code: wh?.code ?? '',
          });
        }

        // Fetch batches currently in a bin
        const batchRes = await fetch(
          '/api/items/batches?filter[current_location_id][_nnull]=true' +
            '&fields[]=id&fields[]=batch_number&fields[]=qty&fields[]=unit&fields[]=weight_kg&fields[]=status' +
            '&fields[]=current_location_id&fields[]=date_updated' +
            '&fields[]=material_id.name&fields[]=material_id.code&fields[]=material_id.hazard_class_id' +
            '&sort[]=-date_updated&limit=1000',
          { cache: 'no-store' }
        );
        const batches = (await batchRes.json())?.data ?? [];

        const mapped: Row[] = batches.map((b: Record<string, unknown>) => {
          const mat = (b.material_id && typeof b.material_id === 'object' ? b.material_id : {}) as Record<string, unknown>;
          const info = b.current_location_id ? locInfo.get(String(b.current_location_id)) : undefined;
          const hazId = mat.hazard_class_id ? String(mat.hazard_class_id) : '';
          return {
            id: String(b.id ?? ''),
            batch_number: String(b.batch_number ?? ''),
            material_name: String(mat.name ?? '—'),
            material_code: String(mat.code ?? ''),
            qty: Number(b.qty ?? 0),
            unit: String(b.unit ?? ''),
            weight_kg: b.weight_kg != null ? Number(b.weight_kg) : null,
            status: String(b.status ?? ''),
            hazard_name: hazId ? hazById.get(hazId) ?? '—' : '—',
            full_path: info?.full_path ?? '—',
            zone: info?.zone ?? '',
            warehouse_code: info?.warehouse_code ?? '',
            date_updated: (b.date_updated as string) ?? null,
          };
        });

        setRows(mapped);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const warehouseChoices = useMemo(() => {
    const codes = Array.from(new Set(rows.map((r) => r.warehouse_code).filter(Boolean))).sort();
    return codes.map((c) => ({ text: c, value: c }));
  }, [rows]);

  const hazardChoices = useMemo(() => {
    const names = Array.from(new Set(rows.map((r) => r.hazard_name).filter((n) => n && n !== '—'))).sort();
    return names.map((n) => ({ text: n, value: n }));
  }, [rows]);

  const statusChoices = useMemo(() => {
    const s = Array.from(new Set(rows.map((r) => r.status).filter(Boolean))).sort();
    return s.map((v) => ({ text: v.replace(/_/g, ' '), value: v }));
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (q && !r.material_name.toLowerCase().includes(q) && !r.batch_number.toLowerCase().includes(q)) {
        return false;
      }
      if (warehouseFilter && r.warehouse_code !== warehouseFilter) return false;
      if (hazardFilter && r.hazard_name !== hazardFilter) return false;
      if (statusFilter && r.status !== statusFilter) return false;
      if (qcFilter && qcBucket(r.status) !== qcFilter) return false;
      return true;
    });
  }, [rows, search, warehouseFilter, hazardFilter, statusFilter, qcFilter]);

  if (loading) {
    return (
      <Group justify="center" py="xl">
        <Loader />
      </Group>
    );
  }

  return (
    <Stack gap="md">
      <Group align="flex-end" gap="sm" grow wrap="wrap">
        <TextInput
          label="Search"
          placeholder="Material or batch number"
          leftSection={<IconSearch size={14} />}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
        />
        <SelectDropdown
          label="Warehouse"
          placeholder="All"
          choices={[{ text: 'All warehouses', value: '' }, ...warehouseChoices]}
          value={warehouseFilter}
          onChange={(v) => setWarehouseFilter(String(v ?? ''))}
        />
        <SelectDropdown
          label="Hazard Class"
          placeholder="All"
          choices={[{ text: 'All hazards', value: '' }, ...hazardChoices]}
          value={hazardFilter}
          onChange={(v) => setHazardFilter(String(v ?? ''))}
        />
        <SelectDropdown
          label="Quality Status"
          placeholder="All"
          choices={[
            { text: 'All', value: '' },
            { text: 'Ready to use', value: 'released' },
            { text: 'Waiting or on hold', value: 'hold' },
          ]}
          value={qcFilter}
          onChange={(v) => setQcFilter(String(v ?? ''))}
        />
        <SelectDropdown
          label="Storage Status"
          placeholder="All"
          choices={[{ text: 'All statuses', value: '' }, ...statusChoices]}
          value={statusFilter}
          onChange={(v) => setStatusFilter(String(v ?? ''))}
        />
      </Group>

      <Text size="xs" c="dimmed">
        {filtered.length} of {rows.length} inventory record{rows.length !== 1 ? 's' : ''}
      </Text>

      {filtered.length === 0 ? (
        <Alert icon={<IconInfoCircle size={16} />} color="gray" variant="light">
          No inventory matches the current filters.
        </Alert>
      ) : (
        <ScrollArea>
          <Table striped highlightOnHover withTableBorder miw={900}>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Material</Table.Th>
                <Table.Th>Batch</Table.Th>
                <Table.Th>Qty</Table.Th>
                <Table.Th>Storage Location</Table.Th>
                <Table.Th>Hazard</Table.Th>
                <Table.Th>Quality</Table.Th>
                <Table.Th>Storage Status</Table.Th>
                <Table.Th>Last Updated</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filtered.map((r) => {
                const bucket = qcBucket(r.status);
                return (
                  <Table.Tr key={r.id}>
                    <Table.Td>
                      <Text size="sm" fw={500}>
                        {r.material_name}
                      </Text>
                      {r.material_code && (
                        <Text size="xs" c="dimmed">
                          {r.material_code}
                        </Text>
                      )}
                    </Table.Td>
                    <Table.Td style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>
                      {r.batch_number}
                    </Table.Td>
                    <Table.Td>
                      {r.qty} {r.unit}
                    </Table.Td>
                    <Table.Td style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>
                      {r.full_path}
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{r.hazard_name}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        size="sm"
                        variant="light"
                        color={bucket === 'released' ? 'green' : bucket === 'hold' ? 'orange' : 'gray'}
                      >
                        {bucket === 'released' ? 'ready to use' : bucket === 'hold' ? 'waiting or on hold' : 'other'}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Badge size="sm" variant="outline">
                        {r.status.replace(/_/g, ' ')}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="xs" c="dimmed">
                        {r.date_updated ? new Date(r.date_updated).toLocaleString() : '—'}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      )}
    </Stack>
  );
}
