'use client';

import {
  Stack, Title, Text, Group, Badge, Alert, Paper, Button,
  Divider, Collapse, Modal, Textarea, Select, Loader, ThemeIcon, Progress,
} from '@mantine/core';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { notifications } from '@mantine/notifications';
import {
  IconInfoCircle, IconCheck, IconAlertTriangle,
  IconChevronDown, IconChevronUp, IconStar, IconLock,
} from '@tabler/icons-react';

const STATUS_COLORS: Record<string, string> = {
  qc_pending: 'orange', under_qc: 'blue', approved: 'green', hold: 'yellow',
  rejected: 'red', storage_assigned: 'teal', stored_available: 'green',
  requested: 'grape', issued: 'indigo', consumed: 'dark',
};
const STATUS_LABELS: Record<string, string> = {
  qc_pending: 'QC Pending', under_qc: 'Under QC', approved: 'QC Approved',
  hold: 'On Hold', rejected: 'Rejected', storage_assigned: 'Storage Assigned',
  stored_available: 'Stored — Available', requested: 'Requested for Production',
  issued: 'Issued to Production', consumed: 'Consumed',
};

interface CompatibleLocation {
  id: string;
  location_code: string;
  zone: string;
  temperature_class: string | null;
  capacity_kg: number | null;
  current_occupancy_kg: number;
  current_material_name: string | null;
  occupancy_pct: number;
  available_kg: number;
  slot_state: 'empty' | 'same_material';
  reason: string;
  is_recommended: boolean;
}

interface DifferentMaterialLocation {
  id: string;
  location_code: string;
  zone: string;
  current_material_name: string | null;
  capacity_kg: number | null;
  current_occupancy_kg: number;
  block_reason: string;
}

interface IncompatibleLocation {
  id: string;
  location_code: string;
  zone: string;
  incompatibility_reason: string;
}

interface SlotData {
  compatible: CompatibleLocation[];
  different_material: DifferentMaterialLocation[];
  incompatible: IncompatibleLocation[];
  batch: { batch_number: string; weight_kg: number | null; hazard_class: string | null; required_temperature_class: string | null };
}

interface BatchInfo {
  id: string;
  batch_number: string;
  status: string;
  qty: number;
  unit: string;
  weight_kg: number | null;
  hazard_class: string | null;
  required_temperature_class: string | null;
  current_location_id: string | null;
}

const OVERRIDE_REASONS = [
  { value: 'manager_approved', label: 'Manager approved exception' },
  { value: 'temporary_placement', label: 'Temporary placement — will relocate' },
  { value: 'emergency_storage', label: 'Emergency storage — no compatible slot available' },
  { value: 'other', label: 'Other (explain in notes)' },
];

export default function BatchDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const batchId = id as string;

  const [batch, setBatch] = useState<BatchInfo | null>(null);
  const [slots, setSlots] = useState<SlotData | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [showDifferentMaterial, setShowDifferentMaterial] = useState(false);
  const [showIncompatible, setShowIncompatible] = useState(false);
  const [saving, setSaving] = useState(false);

  // Override modal (only for truly incompatible — different_material is a hard block)
  const [overrideLocation, setOverrideLocation] = useState<IncompatibleLocation | null>(null);
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideNotes, setOverrideNotes] = useState('');

  const loadBatch = useCallback(async () => {
    const res = await fetch(
      `/api/items/batches/${batchId}?fields[]=id&fields[]=batch_number&fields[]=status&fields[]=qty&fields[]=unit&fields[]=weight_kg&fields[]=hazard_class&fields[]=required_temperature_class&fields[]=current_location_id`
    );
    if (res.ok) setBatch((await res.json())?.data ?? null);
  }, [batchId]);

  const loadSlots = useCallback(async () => {
    setLoadingSlots(true);
    try {
      const res = await fetch(`/api/warehouse/smart-slots?batch_id=${batchId}`);
      if (res.ok) setSlots(await res.json());
    } finally {
      setLoadingSlots(false);
    }
  }, [batchId]);

  useEffect(() => { loadBatch(); }, [loadBatch]);
  useEffect(() => { if (batch?.status === 'approved') loadSlots(); }, [batch?.status, loadSlots]);

  const assignLocation = async (locationId: string, isOverride = false, overrideReasonVal = '', overrideNotesVal = '') => {
    setSaving(true);
    try {
      const body: Record<string, unknown> = { current_location_id: locationId };
      if (isOverride) {
        body.notes = `OVERRIDE — Reason: ${overrideReasonVal}. Notes: ${overrideNotesVal}`;
      }
      const res = await fetch(`/api/items/batches/${batchId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.errors?.[0]?.message ?? err?.error ?? 'Save failed');
      }
      notifications.show({
        title: 'Location assigned',
        message: isOverride
          ? 'Override recorded. Batch stored with exception noted in audit trail.'
          : 'Batch stored. Status updated to Stored — Available.',
        color: 'green',
      });
      setOverrideLocation(null);
      setOverrideReason('');
      setOverrideNotes('');
      await loadBatch();
    } catch (err) {
      notifications.show({ title: 'Error', message: err instanceof Error ? err.message : 'Failed', color: 'red' });
    } finally {
      setSaving(false);
    }
  };

  const handleOverrideConfirm = () => {
    if (!overrideReason) { notifications.show({ title: 'Required', message: 'Select an override reason', color: 'orange' }); return; }
    if (!overrideNotes.trim()) { notifications.show({ title: 'Required', message: 'Override notes are required', color: 'orange' }); return; }
    if (overrideLocation) assignLocation(overrideLocation.id, true, overrideReason, overrideNotes);
  };

  if (!batch) return <Stack p="md"><Loader /></Stack>;

  const isReadyForPutaway = batch.status === 'approved';
  const isStored = batch.status === 'stored_available';

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <div>
          <Title order={2}>Batch Detail</Title>
          <Text c="dimmed" size="sm">{batch.batch_number}</Text>
        </div>
        <Badge size="lg" color={STATUS_COLORS[batch.status] ?? 'gray'} variant="light">
          {STATUS_LABELS[batch.status] ?? batch.status.replace(/_/g, ' ')}
        </Badge>
      </Group>

      <Paper p="sm" radius="md" withBorder>
        <Group gap="xl" wrap="wrap">
          <Text size="sm"><strong>Qty:</strong> {batch.qty} {batch.unit}</Text>
          {batch.weight_kg != null && <Text size="sm"><strong>Weight:</strong> {batch.weight_kg} kg</Text>}
          {batch.hazard_class && <Text size="sm"><strong>Hazard:</strong> {batch.hazard_class.replace(/_/g, ' ')}</Text>}
          {batch.required_temperature_class && <Text size="sm"><strong>Temp:</strong> {batch.required_temperature_class}</Text>}
        </Group>
      </Paper>

      {/* ── SMART SLOTTING PICKER ── */}
      {isReadyForPutaway && (
        <>
          <Divider label="Smart Location Assignment" labelPosition="left" />
          <Alert icon={<IconInfoCircle size={16} />} color="teal" variant="light">
            Select a storage location. Each location holds <strong>one material type only</strong>.
            Status updates to <strong>Stored — Available</strong> automatically on save.
          </Alert>

          {loadingSlots ? (
            <Group justify="center" py="md">
              <Loader size="sm" />
              <Text size="sm" c="dimmed">Calculating compatible locations…</Text>
            </Group>
          ) : slots ? (
            <Stack gap="md">

              {/* ── SECTION 1: Recommended (green) ── */}
              <div>
                <Text size="sm" fw={700} c="teal" mb="xs">
                  ✓ Recommended locations ({slots.compatible.length})
                </Text>
                {slots.compatible.length === 0 ? (
                  <Alert color="orange" variant="light" icon={<IconAlertTriangle size={16} />}>
                    No compatible locations available. Check the sections below or contact your supervisor.
                  </Alert>
                ) : (
                  <Stack gap="xs">
                    {slots.compatible.map((loc) => (
                      <Paper
                        key={loc.id}
                        p="sm"
                        radius="md"
                        withBorder
                        style={{
                          cursor: 'pointer',
                          borderColor: loc.is_recommended ? 'var(--mantine-color-teal-5)' : undefined,
                          borderWidth: loc.is_recommended ? 2 : 1,
                        }}
                        onClick={() => assignLocation(loc.id)}
                      >
                        <Group justify="space-between" wrap="nowrap" align="flex-start">
                          <Group gap="sm" align="flex-start">
                            {loc.is_recommended && (
                              <ThemeIcon size="sm" color="teal" variant="light" radius="xl" mt={2}>
                                <IconStar size={12} />
                              </ThemeIcon>
                            )}
                            <div style={{ minWidth: 0 }}>
                              <Group gap="xs" mb={2}>
                                <Text size="sm" fw={600}>{loc.location_code}</Text>
                                {loc.is_recommended && <Badge size="xs" color="teal">Recommended</Badge>}
                                <Badge size="xs" variant="light" color={loc.slot_state === 'same_material' ? 'blue' : 'gray'}>
                                  {loc.slot_state === 'same_material' ? 'Same material' : 'Empty'}
                                </Badge>
                                <Badge size="xs" variant="light" color="gray">{loc.zone.replace(/_/g, ' ')}</Badge>
                              </Group>
                              <Text size="xs" c="dimmed">{loc.reason}</Text>
                              {loc.slot_state === 'same_material' && loc.current_material_name && (
                                <Text size="xs" c="blue.6">Storing: {loc.current_material_name}</Text>
                              )}
                            </div>
                          </Group>
                          <Group gap="xs" wrap="nowrap" align="center">
                            <Stack gap={2} align="flex-end" style={{ minWidth: 100 }}>
                              <Text size="xs" c="dimmed">{loc.current_occupancy_kg}/{loc.capacity_kg ?? '?'} kg</Text>
                              <Progress value={loc.occupancy_pct} size="xs" color="teal" style={{ width: 80 }} />
                            </Stack>
                            <Button size="compact-xs" color="teal" variant="filled" loading={saving}>
                              Assign
                            </Button>
                          </Group>
                        </Group>
                      </Paper>
                    ))}
                  </Stack>
                )}
              </div>

              {/* ── SECTION 2: Different material (yellow, collapsed, hard block) ── */}
              {slots.different_material.length > 0 && (
                <div>
                  <Button
                    variant="subtle"
                    size="compact-sm"
                    color="yellow"
                    leftSection={showDifferentMaterial ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
                    onClick={() => setShowDifferentMaterial(v => !v)}
                    mb="xs"
                  >
                    Available but occupied by different material ({slots.different_material.length})
                  </Button>
                  <Collapse in={showDifferentMaterial}>
                    <Alert color="yellow" variant="light" icon={<IconLock size={14} />} mb="xs">
                      <Text size="xs">
                        These locations meet all technical requirements but are occupied by a different material.
                        The <strong>single-material rule</strong> prevents mixing — they cannot be selected until cleared.
                      </Text>
                    </Alert>
                    <Stack gap="xs">
                      {slots.different_material.map((loc) => (
                        <Paper key={loc.id} p="sm" radius="md" withBorder style={{ opacity: 0.75, borderColor: 'var(--mantine-color-yellow-4)' }}>
                          <Group justify="space-between" wrap="nowrap">
                            <div>
                              <Group gap="xs" mb={2}>
                                <Text size="sm" fw={600}>{loc.location_code}</Text>
                                <Badge size="xs" color="yellow" variant="light">Different material</Badge>
                                <Badge size="xs" variant="light" color="gray">{loc.zone.replace(/_/g, ' ')}</Badge>
                              </Group>
                              <Text size="xs" c="yellow.7">{loc.block_reason}</Text>
                            </div>
                            <Group gap="xs" wrap="nowrap">
                              <Text size="xs" c="dimmed">{loc.current_occupancy_kg}/{loc.capacity_kg ?? '?'} kg</Text>
                              <Badge size="xs" color="gray" variant="outline" leftSection={<IconLock size={10} />}>
                                Blocked
                              </Badge>
                            </Group>
                          </Group>
                        </Paper>
                      ))}
                    </Stack>
                  </Collapse>
                </div>
              )}

              {/* ── SECTION 3: Incompatible (grey, collapsed, override allowed) ── */}
              {slots.incompatible.length > 0 && (
                <div>
                  <Button
                    variant="subtle"
                    size="compact-sm"
                    color="gray"
                    leftSection={showIncompatible ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
                    onClick={() => setShowIncompatible(v => !v)}
                    mb="xs"
                  >
                    Incompatible locations ({slots.incompatible.length})
                  </Button>
                  <Collapse in={showIncompatible}>
                    <Stack gap="xs">
                      {slots.incompatible.map((loc) => (
                        <Paper
                          key={loc.id}
                          p="sm"
                          radius="md"
                          withBorder
                          style={{ cursor: 'pointer', opacity: 0.6, borderColor: 'var(--mantine-color-gray-4)' }}
                          onClick={() => setOverrideLocation(loc)}
                        >
                          <Group justify="space-between" wrap="nowrap">
                            <div>
                              <Group gap="xs" mb={2}>
                                <Text size="sm" fw={600}>{loc.location_code}</Text>
                                <Badge size="xs" color="red" variant="light">Incompatible</Badge>
                              </Group>
                              <Text size="xs" c="dimmed">{loc.incompatibility_reason}</Text>
                            </div>
                            <Button size="compact-xs" color="gray" variant="subtle">Override</Button>
                          </Group>
                        </Paper>
                      ))}
                    </Stack>
                  </Collapse>
                </div>
              )}
            </Stack>
          ) : null}
        </>
      )}

      {isStored && (
        <Alert icon={<IconCheck size={16} />} color="green" variant="light">
          This batch is stored and available for production scheduling.
          A movement log entry has been recorded.
        </Alert>
      )}

      {/* Override modal — only for incompatible locations, not different-material */}
      <Modal
        opened={!!overrideLocation}
        onClose={() => setOverrideLocation(null)}
        title={<Text fw={600}>Override Storage Warning</Text>}
        size="md"
      >
        <Stack gap="sm">
          <Alert icon={<IconAlertTriangle size={16} />} color="orange" variant="light">
            <Text size="sm" fw={500}>
              Location <strong>{overrideLocation?.location_code}</strong> does not meet storage requirements.
            </Text>
            <Text size="xs" c="dimmed" mt={4}>{overrideLocation?.incompatibility_reason}</Text>
          </Alert>
          <Select
            label="Override Reason *"
            placeholder="Select a reason"
            data={OVERRIDE_REASONS}
            value={overrideReason}
            onChange={(v) => setOverrideReason(v ?? '')}
            required
          />
          <Textarea
            label="Override Notes *"
            placeholder="Explain why this override is necessary. This will be recorded in the audit trail."
            value={overrideNotes}
            onChange={(e) => setOverrideNotes(e.currentTarget.value)}
            minRows={3}
            required
          />
          <Group justify="flex-end">
            <Button variant="subtle" onClick={() => setOverrideLocation(null)}>Cancel</Button>
            <Button color="orange" loading={saving} onClick={handleOverrideConfirm}>
              Confirm Override &amp; Assign
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Button variant="subtle" size="sm" onClick={() => router.push('/warehouse/batches')}>
        ← Back to Batches
      </Button>
    </Stack>
  );
}
