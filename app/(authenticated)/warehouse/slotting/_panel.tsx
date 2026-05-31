'use client';

import {
  Stack,
  Group,
  Text,
  Loader,
  Paper,
  Badge,
  Alert,
  Button,
  Table,
  Box,
  ScrollArea,
} from '@mantine/core';
import { useEffect, useState, useCallback } from 'react';
import { IconWand, IconInfoCircle, IconTrophy, IconBan } from '@tabler/icons-react';
import { SelectDropdown } from '@/components/ui/select-dropdown';
import { Input } from '@/components/ui/input';

interface BatchOption {
  id: string;
  batch_number: string;
  status: string;
  material_name: string;
}

interface Candidate {
  location_id: string;
  location_code: string;
  zone: string;
  rank: number;
  score: number;
  temperature_score: number;
  hazard_score: number;
  capacity_score: number;
  occupancy_score: number;
  occupancy_after_pct: number;
  available_after: number | null;
  capacity_unit: string;
  slot_state: 'empty' | 'same_material';
  is_recommended: boolean;
  reasoning: string;
  comparison?: {
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

interface SlotResult {
  batch: { batch_number: string };
  material: { name: string } | null;
  is_packaging: boolean;
  weights: { temperature: number; hazard: number; capacity: number; occupancy: number };
  candidates: Candidate[];
  eliminated: Eliminated[];
}

const RANK_COLORS = ['yellow', 'gray', 'orange'];

export function AutoSlottingPanel() {
  const [batches, setBatches] = useState<BatchOption[]>([]);
  const [batchesLoading, setBatchesLoading] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [result, setResult] = useState<SlotResult | null>(null);
  const [computing, setComputing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(
      '/api/items/batches?filter[status][_in]=approved,storage_assigned,stored_available' +
        '&fields[]=id&fields[]=batch_number&fields[]=status&fields[]=material_id.name' +
        '&sort[]=-date_created&limit=200',
      { cache: 'no-store' }
    )
      .then((r) => r.json())
      .then((d) => {
        const list: BatchOption[] = (d?.data ?? []).map((b: Record<string, unknown>) => ({
          id: String(b.id ?? ''),
          batch_number: String(b.batch_number ?? ''),
          status: String(b.status ?? ''),
          material_name:
            b.material_id && typeof b.material_id === 'object'
              ? String((b.material_id as Record<string, unknown>).name ?? '')
              : '',
        }));
        setBatches(list);
      })
      .finally(() => setBatchesLoading(false));
  }, []);

  const compute = useCallback(async (batchId: string) => {
    if (!batchId) return;
    setComputing(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/warehouse/smart-slots?batch_id=${batchId}&limit=3`, {
        cache: 'no-store',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'Failed to compute recommendations');
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to compute recommendations');
    } finally {
      setComputing(false);
    }
  }, []);

  const batchChoices = batches.map((b) => ({
    text: `${b.batch_number}${b.material_name ? ` — ${b.material_name}` : ''} (${b.status.replace(/_/g, ' ')})`,
    value: b.id,
  }));

  return (
    <Stack gap="md">
      <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
        Rule-based engine (no AI/LLM). Locations are scored on{' '}
        <strong>Temperature 40% · Hazard 30% · Capacity 15% · Occupancy 15%</strong>. Any location
        that is hazard-incompatible, temperature-incompatible, or lacks capacity is eliminated
        outright. The top recommendation and its reasoning are saved when a batch is QC-released.
      </Alert>

      <Group align="flex-end" gap="sm">
        {batchesLoading ? (
          <Input label="Batch" placeholder="Loading batches…" disabled onChange={() => {}} />
        ) : batchChoices.length > 0 ? (
          <Box style={{ flex: 1, maxWidth: 560 }}>
            <SelectDropdown
              label="Select a QC-released batch"
              placeholder="Choose a batch to slot"
              choices={batchChoices}
              value={selectedBatch}
              onChange={(v) => setSelectedBatch(String(v ?? ''))}
              searchable
            />
          </Box>
        ) : (
          <Input
            label="Batch"
            value=""
            placeholder="No approved batches available"
            disabled
            onChange={() => {}}
          />
        )}
        <Button
          leftSection={<IconWand size={16} />}
          onClick={() => compute(selectedBatch)}
          disabled={!selectedBatch || computing}
          loading={computing}
        >
          Compute Recommendations
        </Button>
      </Group>

      {error && (
        <Alert color="red" variant="light">
          {error}
        </Alert>
      )}

      {computing && (
        <Group justify="center" py="xl">
          <Loader />
        </Group>
      )}

      {result && !computing && (
        <Stack gap="md">
          <Group gap="xs">
            <Text fw={600}>Recommendations for</Text>
            <Badge variant="light" size="lg" style={{ fontFamily: 'monospace' }}>
              {result.batch.batch_number}
            </Badge>
            {result.material && (
              <Text size="sm" c="dimmed">
                {result.material.name}
              </Text>
            )}
          </Group>

          {result.candidates.length === 0 ? (
            <Alert color="orange" variant="light" icon={<IconInfoCircle size={16} />}>
              No compatible location found. All candidate bins were eliminated (see below).
            </Alert>
          ) : (
            <Stack gap="sm">
              {result.candidates.map((c) => (
                <Paper
                  key={c.location_id}
                  p="md"
                  radius="md"
                  withBorder
                  style={{
                    borderColor: c.is_recommended ? 'var(--mantine-color-teal-5)' : undefined,
                    borderWidth: c.is_recommended ? 2 : 1,
                  }}
                >
                  <Group justify="space-between" wrap="nowrap" align="flex-start">
                    <Group gap="sm" wrap="nowrap">
                      <Badge
                        size="lg"
                        color={RANK_COLORS[c.rank - 1] ?? 'gray'}
                        leftSection={c.rank === 1 ? <IconTrophy size={12} /> : undefined}
                      >
                        Rank {c.rank}
                      </Badge>
                      <div>
                        <Text fw={700} style={{ fontFamily: 'monospace' }}>
                          {c.location_code}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {c.zone.replace(/_/g, ' ')} ·{' '}
                          {c.slot_state === 'same_material' ? 'consolidate' : 'empty'}
                        </Text>
                      </div>
                    </Group>
                    <div style={{ textAlign: 'right', minWidth: 90 }}>
                      <Text size="xl" fw={700} c={c.is_recommended ? 'teal' : undefined}>
                        {c.score}
                      </Text>
                      <Text size="xs" c="dimmed">
                        score / 100
                      </Text>
                    </div>
                  </Group>

                  <Stack gap={4} mt="sm" ml={4}>
                    {c.comparison ? (
                      <>
                        <Group gap={6} wrap="nowrap">
                          <Badge size="xs" color={c.comparison.temp_ok ? 'teal' : 'red'} variant="dot" />
                          <Text size="xs">
                            <strong>Temperature:</strong> Material needs {c.comparison.material_temp} → Location accepts {c.comparison.location_temp}
                          </Text>
                        </Group>
                        <Group gap={6} wrap="nowrap">
                          <Badge size="xs" color={c.comparison.hazard_allowed ? 'teal' : 'red'} variant="dot" />
                          <Text size="xs">
                            <strong>Hazard Class:</strong> {c.comparison.material_hazard} — {c.comparison.hazard_allowed ? 'Allowed' : 'Not allowed'}
                          </Text>
                        </Group>
                        <Group gap={6} wrap="nowrap">
                          <Badge size="xs" color={c.comparison.capacity_ok ? 'teal' : 'red'} variant="dot" />
                          <Text size="xs">
                            <strong>Capacity:</strong> Batch {c.comparison.material_weight} → {c.comparison.location_available}
                          </Text>
                        </Group>
                        <Group gap={6} wrap="nowrap">
                          <Badge size="xs" color={c.comparison.after_occupancy_pct > 90 ? 'orange' : 'teal'} variant="dot" />
                          <Text size="xs">
                            <strong>Occupancy:</strong> {c.comparison.current_occupancy_pct}% now → {c.comparison.after_occupancy_pct}% after putaway
                          </Text>
                        </Group>
                      </>
                    ) : (
                      <Text size="xs" c="dimmed">{c.reasoning}</Text>
                    )}
                  </Stack>
                </Paper>
              ))}
            </Stack>
          )}

          {result.eliminated.length > 0 && (
            <Paper p="md" radius="md" withBorder>
              <Group gap="xs" mb="sm">
                <IconBan size={16} color="var(--mantine-color-red-6)" />
                <Text fw={600} size="sm">
                  Eliminated locations ({result.eliminated.length})
                </Text>
              </Group>
              <ScrollArea.Autosize mah={240}>
                <Table striped>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Location</Table.Th>
                      <Table.Th>Zone</Table.Th>
                      <Table.Th>Reason</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {result.eliminated.map((e) => (
                      <Table.Tr key={e.location_id}>
                        <Table.Td style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>
                          {e.location_code}
                        </Table.Td>
                        <Table.Td>
                          <Text size="xs" c="dimmed">
                            {e.zone.replace(/_/g, ' ')}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="xs">{e.reason}</Text>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </ScrollArea.Autosize>
            </Paper>
          )}
        </Stack>
      )}
    </Stack>
  );
}
