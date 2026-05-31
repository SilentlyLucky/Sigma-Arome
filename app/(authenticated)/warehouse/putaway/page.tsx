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
  Divider,
  Box,
} from '@mantine/core';
import { CollectionList } from '@/components/ui/collection-list';
import { SelectDropdown } from '@/components/ui/select-dropdown';
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

interface Eliminated {
  location_id: string;
  location_code: string;
  zone: string;
  reason: string;
}

const RANK_COLORS = ['yellow', 'gray', 'orange'];

export default function PutawayPage() {
  const router = useRouter();
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [eliminated, setEliminated] = useState<Eliminated[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [confirming, setConfirming] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [opened, { open, close }] = useDisclosure(false);

  const openPutaway = async (batch: Batch) => {
    setSelectedBatch(batch);
    setSelectedLocation('');
    setCandidates([]);
    setEliminated([]);
    setLoadingSlots(true);
    open();

    try {
      const res = await fetch(`/api/warehouse/smart-slots?batch_id=${batch.id}&limit=3`, {
        cache: 'no-store',
      });
      const data = await res.json();
      if (res.ok) {
        const cands: Candidate[] = data?.candidates ?? [];
        const elim: Eliminated[] = data?.eliminated ?? [];
        setCandidates(cands);
        setEliminated(elim);
        if (cands.length > 0) setSelectedLocation(cands[0].location_id);
      } else {
        notifications.show({
          title: 'Error',
          message: data?.error ?? 'Could not find storage suggestions',
          color: 'red',
        });
      }
    } catch {
      notifications.show({ title: 'Error', message: 'Could not load storage suggestions', color: 'red' });
    } finally {
      setLoadingSlots(false);
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

  // Sort eliminated locations by concern severity (least severe first = most viable for manual override)
  // Priority: capacity > single-material > hazard > temperature > zone mismatch
  const concernSeverity = (reason: string): number => {
    if (reason.includes('Capacity insufficient')) return 1;
    if (reason.includes('single-material')) return 2;
    if (reason.includes('Hazard') || reason.includes('hazard')) return 3;
    if (reason.includes('Temperature')) return 4;
    if (reason.includes('Zone')) return 5;
    return 3;
  };

  const sortedEliminated = [...eliminated].sort(
    (a, b) => concernSeverity(a.reason) - concernSeverity(b.reason)
  );

  const sortedEliminatedChoices = sortedEliminated.map((e) => ({
    text: `${e.location_code} — ${e.zone.replace(/_/g, ' ')} ⚠ ${e.reason.slice(0, 60)}${e.reason.length > 60 ? '…' : ''}`,
    value: e.location_id,
  }));

  const selectedConcern = eliminated.find((e) => e.location_id === selectedLocation) ?? null;

  const locationChoices = candidates.map((c) => ({
    text: `#${c.rank} ${c.location_code} — score ${c.score} · ${c.zone.replace(/_/g, ' ')}`,
    value: c.location_id,
  }));

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

      <Modal opened={opened} onClose={close} title={`Store batch: ${selectedBatch?.batch_number}`} size="lg">
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

            {candidates.length === 0 ? (
              <Stack gap="sm">
                <Alert color="orange" variant="light" icon={<IconInfoCircle size={16} />}>
                  No fully suitable location was found. You can choose a location manually, but
                  review the warning before confirming.
                </Alert>

                {eliminated.length > 0 && (
                  <>
                    <Text size="sm" fw={600}>
                      Manual selection (sorted by least concern)
                    </Text>
                    <SelectDropdown
                      label="Storage Location (manual override)"
                      placeholder="Select a location — review concerns"
                      choices={sortedEliminatedChoices}
                      value={selectedLocation}
                      onChange={(v) => setSelectedLocation(String(v ?? ''))}
                      searchable
                    />
                    {selectedLocation && selectedConcern && (
                      <Alert color="red" variant="light" icon={<IconAlertTriangle size={16} />}>
                        <Text size="sm" fw={600}>
                          Concern for {selectedConcern.location_code}:
                        </Text>
                        <Text size="sm">{selectedConcern.reason}</Text>
                      </Alert>
                    )}
                  </>
                )}
              </Stack>
            ) : (
              <Stack gap="xs">
                <Group gap={6}>
                  <IconWand size={15} color="var(--mantine-color-teal-6)" />
                  <Text size="sm" fw={600}>
                    Suggested storage locations
                  </Text>
                </Group>
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
                              {c.zone.replace(/_/g, ' ')} ·{' '}
                              {c.slot_state === 'same_material' ? 'same material' : 'empty'}
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
                          <Text size="xs">
                            <strong>Temperature:</strong> Material needs {cmp?.material_temp} → Location accepts {cmp?.location_temp}
                          </Text>
                        </Group>
                        <Group gap={6} wrap="nowrap">
                          <Badge size="xs" color={cmp?.hazard_allowed ? 'teal' : 'red'} variant="dot" />
                          <Text size="xs">
                            <strong>Hazard Class:</strong> {cmp?.material_hazard} — {cmp?.hazard_allowed ? 'Safe for this bin' : 'Not suitable for this bin'}
                          </Text>
                        </Group>
                        <Group gap={6} wrap="nowrap">
                          <Badge size="xs" color={cmp?.capacity_ok ? 'teal' : 'red'} variant="dot" />
                          <Text size="xs">
                            <strong>Capacity:</strong> Batch {cmp?.material_weight} → {cmp?.location_available}
                          </Text>
                        </Group>
                        <Group gap={6} wrap="nowrap">
                          <Badge size="xs" color={cmp?.after_occupancy_pct && cmp.after_occupancy_pct > 90 ? 'orange' : 'teal'} variant="dot" />
                          <Text size="xs">
                            <strong>Occupancy:</strong> {cmp?.current_occupancy_pct}% now → {cmp?.after_occupancy_pct}% after storage
                          </Text>
                        </Group>
                      </Stack>
                    </Paper>
                  );
                })}

                <Divider my="xs" label="Or pick manually" labelPosition="center" />

                <SelectDropdown
                  label="Storage Location"
                  placeholder="Select storage location"
                  choices={locationChoices}
                  value={selectedLocation}
                  onChange={(v) => setSelectedLocation(String(v ?? ''))}
                  searchable
                />
              </Stack>
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
