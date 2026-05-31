'use client';

import {
  Stack,
  Title,
  Text,
  Alert,
  Paper,
  Group,
  Badge,
  Button,
  Modal,
  Loader,
  Box,
  SimpleGrid,
  ScrollArea,
  TextInput,
} from '@mantine/core';
import { CollectionList } from '@/components/ui/collection-list';
import { IconInfoCircle, IconMapPin, IconCheck, IconTrophy, IconWand, IconAlertTriangle } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { notifications } from '@mantine/notifications';
import { useDisclosure } from '@mantine/hooks';

interface Batch {
  id: string;
  batch_number: string;
  material_id: string;
  qty: number;
  unit: string;
  status: string;
  recommended_location_id: string | null;
}

interface Candidate {
  location_id: string;
  location_code: string;
  zone: string;
  rank: number;
  score: number;
  occupancy_after_pct: number;
  available_after: number | null;
  capacity_unit: string;
  slot_state: 'empty' | 'same_material';
  is_recommended: boolean;
  reasoning: string;
  comparison: {
    material_temp: string;
    location_temp: string;
    temp_ok: boolean;
    material_hazard: string;
    hazard_allowed: boolean;
    material_weight: string;
    location_available: string;
    capacity_ok: boolean;
    current_occupancy_pct: number;
    after_occupancy_pct: number;
  };
}

interface WarehouseLocation {
  id: string;
  location_code: string;
  zone: string;
  temperature_min: number | null;
  temperature_max: number | null;
  allowed_hazard_classes: string[] | null;
  capacity_kg: number | null;
  current_occupancy_kg: number;
  capacity_pcs: number | null;
  current_occupancy_pcs: number;
  current_material_name: string | null;
  status: string;
}

const RANK_COLORS = ['yellow', 'gray', 'orange', 'blue', 'grape'];

function formatZone(zone: string) {
  return zone.replace(/_/g, ' ');
}

function formatTemperature(location: WarehouseLocation) {
  const min = location.temperature_min ?? 15;
  const max = location.temperature_max ?? 30;
  return `${min}-${max}°C`;
}

function formatCapacity(location: WarehouseLocation) {
  if (location.capacity_kg) {
    return `${location.current_occupancy_kg ?? 0} / ${location.capacity_kg} kg`;
  }
  if (location.capacity_pcs) {
    return `${location.current_occupancy_pcs ?? 0} / ${location.capacity_pcs} pcs`;
  }
  return 'No limit set';
}

export default function PutawayPage() {
  const router = useRouter();
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [locations, setLocations] = useState<WarehouseLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [locationSearch, setLocationSearch] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [opened, { open, close }] = useDisclosure(false);

  const openPutaway = async (batch: Batch) => {
    setSelectedBatch(batch);
    setSelectedLocation('');
    setCandidates([]);
    setLocations([]);
    setLocationSearch('');
    setLoadingSlots(true);
    setLoadingLocations(true);
    open();

    try {
      const [slotRes, locationsRes] = await Promise.all([
        fetch(`/api/warehouse/smart-slots?batch_id=${batch.id}&limit=5`, { cache: 'no-store' }),
        fetch(
          '/api/items/warehouse_locations?filter[is_active][_eq]=true' +
            '&fields[]=id&fields[]=location_code&fields[]=zone&fields[]=temperature_min&fields[]=temperature_max' +
            '&fields[]=allowed_hazard_classes&fields[]=capacity_kg&fields[]=current_occupancy_kg' +
            '&fields[]=capacity_pcs&fields[]=current_occupancy_pcs&fields[]=current_material_name&fields[]=status' +
            '&sort[]=location_code&limit=500',
          { cache: 'no-store' }
        ),
      ]);

      const data = await slotRes.json();
      if (slotRes.ok) {
        const cands: Candidate[] = data?.candidates ?? [];
        setCandidates(cands);
        if (cands.length > 0) setSelectedLocation(cands[0].location_id);
      } else {
        notifications.show({
          title: 'Error',
          message: data?.error ?? 'Could not find storage suggestions',
          color: 'red',
        });
      }

      const locationData = locationsRes.ok ? (await locationsRes.json())?.data ?? [] : [];
      setLocations(locationData);
    } catch {
      notifications.show({ title: 'Error', message: 'Could not load storage suggestions', color: 'red' });
    } finally {
      setLoadingSlots(false);
      setLoadingLocations(false);
    }
  };

  const confirmPutaway = async () => {
    if (!selectedBatch || !selectedLocation) {
      notifications.show({ title: 'Required', message: 'Please select a storage location', color: 'orange' });
      return;
    }
    setConfirming(true);
    try {
      const res = await fetch(`/api/items/batches/${selectedBatch.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'stored_available', current_location_id: selectedLocation }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.errors?.[0]?.message ?? 'Could not confirm storage');
      }
      notifications.show({
        title: 'Storage confirmed',
        message: `Batch ${selectedBatch.batch_number} stored successfully`,
        color: 'green',
      });
      close();
      router.refresh();
    } catch (err) {
      notifications.show({ title: 'Error', message: err instanceof Error ? err.message : 'Failed', color: 'red' });
    } finally {
      setConfirming(false);
    }
  };

  const selectedRecommended = candidates.find((c) => c.location_id === selectedLocation) ?? null;
  const selectedManualLocation = !selectedRecommended
    ? locations.find((location) => location.id === selectedLocation) ?? null
    : null;
  const normalizedLocationSearch = locationSearch.trim().toLowerCase();
  const filteredLocations = locations.filter((location) => {
    if (!normalizedLocationSearch) return true;
    return [
      location.location_code,
      formatZone(location.zone),
      location.status,
      location.current_material_name ?? '',
    ].some((value) => value.toLowerCase().includes(normalizedLocationSearch));
  });

  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Put Away Approved Batches</Title>
        <Text c="dimmed" size="sm">
          Choose storage locations for batches that have passed QC. We suggest locations based on
          temperature needs, hazard rules, available space, and current bin use.
        </Text>
      </div>

      <Alert icon={<IconInfoCircle size={16} />} color="teal" variant="light">
        Only batches approved by QC appear here. Select a batch, review the suggested locations,
        then confirm where it was stored.
      </Alert>

      <CollectionList
        collection="batches"
        enableSearch
        enableSort
        filter={{ status: { _in: ['approved', 'storage_assigned'] } }}
        fields={['batch_number', 'material_id', 'qty', 'unit', 'status', 'recommended_location_id', 'current_location_id']}
        onItemClick={(item) => openPutaway(item as unknown as Batch)}
      />

      <Modal opened={opened} onClose={close} title={`Store batch: ${selectedBatch?.batch_number}`} size="xl">
        {loadingSlots ? (
          <Group justify="center" py="xl">
            <Loader />
          </Group>
        ) : (
          <Stack gap="md">
            <Paper p="sm" radius="sm" withBorder>
              <Group gap="xl">
                <Text size="sm">
                  <strong>Batch:</strong> {selectedBatch?.batch_number}
                </Text>
                <Text size="sm">
                  <strong>Qty:</strong> {selectedBatch?.qty} {selectedBatch?.unit}
                </Text>
                <Badge color={selectedBatch?.status === 'approved' ? 'green' : 'teal'} variant="light">
                  {selectedBatch?.status}
                </Badge>
              </Group>
            </Paper>

            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
              <Paper p="sm" radius="sm" withBorder>
                <Group gap={6} mb="sm">
                  <IconWand size={15} color="var(--mantine-color-teal-6)" />
                  <Text size="sm" fw={700}>Top 5 Recommendations</Text>
                </Group>

                {candidates.length === 0 ? (
                  <Alert color="orange" variant="light" icon={<IconInfoCircle size={16} />}>
                    No fully suitable location was found. You can still choose from the location list on the right.
                  </Alert>
                ) : (
                  <ScrollArea h={470}>
                    <Stack gap="xs">
                      {candidates.map((c) => {
                        const isSel = selectedLocation === c.location_id;
                        const cmp = c.comparison;
                        return (
                          <Paper
                            key={c.location_id}
                            p="sm"
                            radius="sm"
                            withBorder
                            onClick={() => setSelectedLocation(c.location_id)}
                            style={{
                              cursor: 'pointer',
                              borderColor: isSel ? 'var(--mantine-color-teal-5)' : undefined,
                              borderWidth: isSel ? 2 : 1,
                            }}
                          >
                            <Group justify="space-between" wrap="nowrap" align="flex-start">
                              <Group gap="sm" wrap="nowrap">
                                <Badge
                                  color={RANK_COLORS[c.rank - 1] ?? 'gray'}
                                  leftSection={c.rank === 1 ? <IconTrophy size={11} /> : undefined}
                                >
                                  #{c.rank}
                                </Badge>
                                <div>
                                  <Text fw={700} size="sm" style={{ fontFamily: 'monospace' }}>
                                    {c.location_code}
                                  </Text>
                                  <Text size="xs" c="dimmed">
                                    {formatZone(c.zone)} - {c.slot_state === 'same_material' ? 'same material' : 'empty'}
                                  </Text>
                                </div>
                              </Group>
                              <Box style={{ textAlign: 'right', minWidth: 60 }}>
                                <Text fw={700} size="lg" c={isSel ? 'teal' : undefined}>
                                  {c.score}
                                </Text>
                                <Text size="xs" c="dimmed">/ 100</Text>
                              </Box>
                            </Group>

                            <Stack gap={4} mt="sm" ml={4}>
                              <Group gap={6} wrap="nowrap">
                                <Badge size="xs" color={cmp?.temp_ok ? 'teal' : 'red'} variant="dot" />
                                <Text size="xs"><strong>Temp:</strong> {cmp?.material_temp} needed - bin {cmp?.location_temp}</Text>
                              </Group>
                              <Group gap={6} wrap="nowrap">
                                <Badge size="xs" color={cmp?.hazard_allowed ? 'teal' : 'red'} variant="dot" />
                                <Text size="xs"><strong>Hazard:</strong> {cmp?.material_hazard} - {cmp?.hazard_allowed ? 'allowed' : 'not suitable'}</Text>
                              </Group>
                              <Group gap={6} wrap="nowrap">
                                <Badge size="xs" color={cmp?.capacity_ok ? 'teal' : 'red'} variant="dot" />
                                <Text size="xs"><strong>Capacity:</strong> {cmp?.material_weight} batch - {cmp?.location_available}</Text>
                              </Group>
                              <Group gap={6} wrap="nowrap">
                                <Badge size="xs" color={cmp?.after_occupancy_pct && cmp.after_occupancy_pct > 90 ? 'orange' : 'teal'} variant="dot" />
                                <Text size="xs"><strong>Occupancy:</strong> {cmp?.current_occupancy_pct}% now - {cmp?.after_occupancy_pct}% after</Text>
                              </Group>
                            </Stack>
                          </Paper>
                        );
                      })}
                    </Stack>
                  </ScrollArea>
                )}
              </Paper>

              <Paper p="sm" radius="sm" withBorder>
                <Group justify="space-between" align="flex-start" mb="sm">
                  <div>
                    <Text size="sm" fw={700}>Pick Any Location</Text>
                    <Text size="xs" c="dimmed">Manual list is searchable and not rule-ranked.</Text>
                  </div>
                  <Badge variant="light" color="gray">{filteredLocations.length}</Badge>
                </Group>

                <TextInput
                  placeholder="Search code, zone, status, or current material"
                  value={locationSearch}
                  onChange={(event) => setLocationSearch(event.currentTarget.value)}
                  mb="sm"
                />

                {loadingLocations ? (
                  <Group justify="center" py="xl"><Loader size="sm" /></Group>
                ) : (
                  <ScrollArea h={420}>
                    <Stack gap="xs">
                      {filteredLocations.map((location) => {
                        const isSel = selectedLocation === location.id;
                        const isSmartOption = candidates.some((c) => c.location_id === location.id);
                        return (
                          <Paper
                            key={location.id}
                            p="sm"
                            radius="sm"
                            withBorder
                            onClick={() => setSelectedLocation(location.id)}
                            style={{
                              cursor: 'pointer',
                              borderColor: isSel ? 'var(--mantine-color-blue-5)' : undefined,
                              borderWidth: isSel ? 2 : 1,
                            }}
                          >
                            <Group justify="space-between" wrap="nowrap" align="flex-start">
                              <div>
                                <Group gap="xs">
                                  <Text fw={700} size="sm" style={{ fontFamily: 'monospace' }}>{location.location_code}</Text>
                                  {isSmartOption && <Badge size="xs" color="teal" variant="light">recommended list</Badge>}
                                </Group>
                                <Text size="xs" c="dimmed">{formatZone(location.zone)} - {location.status}</Text>
                              </div>
                              <Badge size="xs" color={location.current_material_name ? 'blue' : 'gray'} variant="light">
                                {location.current_material_name ? 'occupied' : 'empty'}
                              </Badge>
                            </Group>

                            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing={4} mt="xs">
                              <Text size="xs"><strong>Temp:</strong> {formatTemperature(location)}</Text>
                              <Text size="xs"><strong>Capacity:</strong> {formatCapacity(location)}</Text>
                              <Text size="xs"><strong>Hazard rules:</strong> {location.allowed_hazard_classes?.length ? String(location.allowed_hazard_classes.length) + ' allowed' : 'No restriction set'}</Text>
                              <Text size="xs"><strong>Current material:</strong> {location.current_material_name ?? 'None'}</Text>
                            </SimpleGrid>
                          </Paper>
                        );
                      })}
                    </Stack>
                  </ScrollArea>
                )}
              </Paper>
            </SimpleGrid>

            {selectedManualLocation && (
              <Alert color="orange" variant="light" icon={<IconAlertTriangle size={16} />}>
                <Text size="sm" fw={700}>Manual location selected: {selectedManualLocation.location_code}</Text>
                <Text size="sm">This location was not selected from the Top 5 recommendations. Review temperature, hazard rules, capacity, and current material before confirming.</Text>
              </Alert>
            )}

            <Group justify="flex-end">
              <Button variant="subtle" onClick={close} disabled={confirming}>
                Cancel
              </Button>
              <Button
                leftSection={<IconCheck size={16} />}
                color="teal"
                loading={confirming}
                onClick={confirmPutaway}
                disabled={!selectedLocation}
              >
                Confirm Storage
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Stack>
  );
}
