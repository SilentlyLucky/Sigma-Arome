'use client';

import { Stack, Title, Text, Group, Badge, Button, Alert } from '@mantine/core';
import { CollectionForm } from '@/components/ui/collection-form';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle } from '@tabler/icons-react';

// Valid next statuses per current status — shown as action buttons
const STATUS_TRANSITIONS: Record<string, Array<{ value: string; label: string; color: string }>> = {
  draft:              [{ value: 'ordered', label: 'Submit Order', color: 'blue' }, { value: 'cancelled', label: 'Cancel', color: 'red' }],
  ordered:            [{ value: 'partially_received', label: 'Mark Partially Received', color: 'yellow' }, { value: 'received', label: 'Mark Fully Received', color: 'green' }, { value: 'cancelled', label: 'Cancel', color: 'red' }],
  partially_received: [{ value: 'received', label: 'Mark Fully Received', color: 'green' }, { value: 'cancelled', label: 'Cancel', color: 'red' }],
  received:           [{ value: 'closed', label: 'Close Order', color: 'gray' }],
  closed:             [],
  cancelled:          [],
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'gray', ordered: 'blue', partially_received: 'yellow',
  received: 'green', closed: 'dark', cancelled: 'red',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft', ordered: 'Ordered / Waiting Arrival',
  partially_received: 'Partially Received', received: 'Received',
  closed: 'Closed', cancelled: 'Cancelled',
};

export default function RawMaterialOrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [status, setStatus] = useState<string | null>(null);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    fetch(`/api/items/raw_material_orders/${id}?fields[]=status`)
      .then((r) => r.json())
      .then((d) => setStatus(d?.data?.status ?? null))
      .catch(() => {});
  }, [id]);

  const handleTransition = async (newStatus: string) => {
    setTransitioning(true);
    try {
      const res = await fetch(`/api/items/raw_material_orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.errors?.[0]?.message ?? 'Status update failed');
      }
      setStatus(newStatus);
      notifications.show({ title: 'Updated', message: `Status changed to ${STATUS_LABELS[newStatus]}`, color: 'green' });
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
          <Title order={2}>Raw Material Order Detail</Title>
          <Text c="dimmed" size="sm">View and update order information.</Text>
        </div>
        {status && (
          <Badge size="lg" color={STATUS_COLORS[status]} variant="light">
            {STATUS_LABELS[status]}
          </Badge>
        )}
      </Group>

      {nextTransitions.length > 0 && (
        <Group gap="xs">
          <Text size="sm" fw={500} c="dimmed">Actions:</Text>
          {nextTransitions.map((t) => (
            <Button
              key={t.value}
              size="xs"
              color={t.color}
              variant="light"
              loading={transitioning}
              onClick={() => handleTransition(t.value)}
            >
              {t.label}
            </Button>
          ))}
        </Group>
      )}

      {(status === 'closed' || status === 'cancelled') && (
        <Alert icon={<IconAlertCircle size={16} />} color="gray" variant="light">
          This order is in a terminal state and cannot be modified.
        </Alert>
      )}

      <CollectionForm
        collection="raw_material_orders"
        mode="edit"
        id={id}
        onSuccess={() => router.push('/ppic/orders')}
        onCancel={() => router.push('/ppic/orders')}
      />
    </Stack>
  );
}
