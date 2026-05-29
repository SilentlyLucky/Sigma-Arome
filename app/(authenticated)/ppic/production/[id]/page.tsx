'use client';

import { Stack, Title, Text, Group, Badge, Button, Alert } from '@mantine/core';
import { CollectionForm } from '@/components/ui/collection-form';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle } from '@tabler/icons-react';

const STATUS_TRANSITIONS: Record<string, Array<{ value: string; label: string; color: string }>> = {
  draft:          [{ value: 'planned', label: 'Mark as Planned', color: 'blue' }, { value: 'cancelled', label: 'Cancel', color: 'red' }],
  planned:        [{ value: 'material_check', label: 'Check Material Readiness', color: 'teal' }, { value: 'cancelled', label: 'Cancel', color: 'red' }],
  material_check: [{ value: 'ready', label: 'Mark Ready', color: 'green' }, { value: 'planned', label: 'Back to Planned', color: 'gray' }],
  ready:          [{ value: 'released', label: 'Release to Production', color: 'blue' }, { value: 'on_hold', label: 'Put on Hold', color: 'orange' }],
  released:       [{ value: 'in_progress', label: 'Start Production', color: 'teal' }, { value: 'on_hold', label: 'Put on Hold', color: 'orange' }],
  in_progress:    [{ value: 'completed', label: 'Mark Completed', color: 'green' }, { value: 'on_hold', label: 'Put on Hold', color: 'orange' }],
  on_hold:        [{ value: 'ready', label: 'Resume', color: 'green' }, { value: 'cancelled', label: 'Cancel', color: 'red' }],
  completed:      [],
  cancelled:      [],
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'gray', planned: 'blue', material_check: 'teal', ready: 'green',
  released: 'indigo', in_progress: 'violet', completed: 'dark',
  on_hold: 'orange', cancelled: 'red',
};
const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft', planned: 'Planned', material_check: 'Material Check',
  ready: 'Ready', released: 'Released', in_progress: 'In Progress',
  completed: 'Completed', on_hold: 'On Hold', cancelled: 'Cancelled',
};

export default function ProductionOrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [status, setStatus] = useState<string | null>(null);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    fetch(`/api/items/production_orders/${id}?fields[]=status`)
      .then((r) => r.json())
      .then((d) => setStatus(d?.data?.status ?? null))
      .catch(() => {});
  }, [id]);

  const handleTransition = async (newStatus: string) => {
    setTransitioning(true);
    try {
      const res = await fetch(`/api/items/production_orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.errors?.[0]?.message ?? 'Status update failed');
      }
      setStatus(newStatus);
      notifications.show({ title: 'Updated', message: `Status → ${STATUS_LABELS[newStatus]}`, color: 'green' });
    } catch (err) {
      notifications.show({ title: 'Error', message: err instanceof Error ? err.message : 'Failed', color: 'red' });
    } finally {
      setTransitioning(false);
    }
  };

  const nextTransitions = status ? (STATUS_TRANSITIONS[status] ?? []) : [];

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-start">
        <div>
          <Title order={2}>Production Order Detail</Title>
          <Text c="dimmed" size="sm">View and manage production plan.</Text>
        </div>
        {status && (
          <Badge size="lg" color={STATUS_COLORS[status]} variant="light">
            {STATUS_LABELS[status] ?? status}
          </Badge>
        )}
      </Group>

      {nextTransitions.length > 0 && (
        <Group gap="xs">
          <Text size="sm" fw={500} c="dimmed">Actions:</Text>
          {nextTransitions.map((t) => (
            <Button key={t.value} size="xs" color={t.color} variant="light" loading={transitioning} onClick={() => handleTransition(t.value)}>
              {t.label}
            </Button>
          ))}
        </Group>
      )}

      {(status === 'completed' || status === 'cancelled') && (
        <Alert icon={<IconAlertCircle size={16} />} color="gray" variant="light">
          This production order is in a terminal state and cannot be modified.
        </Alert>
      )}

      <CollectionForm
        collection="production_orders"
        mode="edit"
        id={id}
        onSuccess={() => router.push('/ppic/production')}
        onCancel={() => router.push('/ppic/production')}
      />
    </Stack>
  );
}
