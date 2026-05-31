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
  Progress,
  Box,
} from '@mantine/core';
import { CollectionList } from '@/components/ui/collection-list';
import { SelectDropdown } from '@/components/ui/select-dropdown';
import { IconInfoCircle, IconMapPin, IconCheck, IconTrophy, IconWand } from '@tabler/icons-react';
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
}

const RANK_COLORS = ['yellow', 'gray', 'orange'];

export default function PutawayPage() {
  const router = useRouter();
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [confirming, setConfirming] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [opened, { open, close }] = useDisclosure(false);

  const openPutaway = async (batch: Batch) => {
    setSelectedBatch(batch);
    setSelectedLocation('');
    setCandidates([]);
    setLoadingSlots(true);
    open();

    try {
      const res = await fetch(`/api/warehouse/smart-slots?batch_id=${batch.id}&limit=3`, {
        cache: 'no-store',
      });
      const data = await res.json();
      if (res.ok) {
        const cands: Candidate[] = data?.candidates ?? [];
        setCandidates(cands);
        // Default to the top recommendation
        if (cands.length > 0) setSelectedLocation(cands[0].location_id);
      } else {
        notifications.show({
          title: 'Error',
          message: data?.error ?? 'Failed to compute recommendations',
          color: 'red',
        });
      }
    } catch {
      notifications.show({ title: 'Error', message: 'Failed to load recommendations', color: 'red' });
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
        throw new Error(err?.errors?.[0]?.message ?? 'Putaway failed');
      }
      notifications.show({
        title: 'Putaway Confirmed',
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

  const locationChoices = candidates.map((c) => ({
    text: `#${c.rank} ${c.location_code} — score ${c.score} · ${c.zone.replace(/_/g, ' ')}`,
    value: c.location_id,
  }));

  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Putaway — Approved Batches</Title>
        <Text c="dimmed" size="sm">
          Assign storage locations and confirm putaway for QC-approved batches. The rule-based
          engine recommends the best bins (Temperature 40% · Hazard 30% · Capacity 15% · Occupancy
          15%).
        </Text>
      </div>

      <Alert icon={<IconInfoCircle size={16} />} color="teal" variant="light">
        Only <strong>QC Approved</strong> batches appear here. Click a batch to see the Top-3 scored
        recommendations and confirm putaway.
      </Alert>

      <CollectionList
        collection="batches"
        enableSearch
        enableSort
        filter={{ status: { _in: ['approved', 'storage_assigned'] } }}
        fields={['batch_number', 'material_id', 'qty', 'unit', 'status', 'recommended_location_id', 'current_location_id']}
        onItemClick={(item) => openPutaway(item as unknown as Batch)}
      />

      <Modal opened={opened} onClose={close} title={`Putaway: ${selectedBatch?.batch_number}`} size="lg">
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
              <Alert color="orange" variant="light" icon={<IconInfoCircle size={16} />}>
                No compatible location found by the rule engine. All candidate bins were eliminated
                (hazard, temperature, or capacity). Please review the warehouse setup.
              </Alert>
            ) : (
              <Stack gap="xs">
                <Group gap={6}>
                  <IconWand size={15} color="var(--mantine-color-teal-6)" />
                  <Text size="sm" fw={600}>
                    Recommended locations
                  </Text>
                </Group>
                {candidates.map((c) => {
                  const isSel = selectedLocation === c.location_id;
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
                              {c.slot_state === 'same_material' ? 'consolidate' : 'empty'} · occ after{' '}
                              {c.occupancy_after_pct}%
                            </Text>
                          </div>
                        </Group>
                        <Box style={{ textAlign: 'right', minWidth: 60 }}>
                          <Text fw={700} c={isSel ? 'teal' : undefined}>
                            {c.score}
                          </Text>
                          <Progress value={c.score} size="xs" mt={2} color="teal" />
                        </Box>
                      </Group>
                      <Text size="xs" c="dimmed" mt={6}>
                        {c.reasoning}
                      </Text>
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
                Confirm Putaway
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Stack>
  );
}
