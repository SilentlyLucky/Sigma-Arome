'use client';

import { Stack, Title, Text, Group, Badge, Button, Alert } from '@mantine/core';
import { CollectionForm } from '@/components/ui/collection-form';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { notifications } from '@mantine/notifications';
import { IconPlayerPlay, IconCheck } from '@tabler/icons-react';

const STATUS_COLORS: Record<string, string> = { ready: 'green', released: 'indigo', in_progress: 'violet', completed: 'teal' };
const STATUS_LABELS: Record<string, string> = { ready: 'Ready', released: 'Released', in_progress: 'In Progress', completed: 'Completed' };

export default function ProductionOrderDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const orderId = id as string;
  const [status, setStatus] = useState<string | null>(null);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    fetch(`/api/items/production_orders/${orderId}?fields[]=status`)
      .then(r => r.json()).then(d => setStatus(d?.data?.status ?? null)).catch(() => {});
  }, [orderId]);

  const updateStatus = async (newStatus: string, message: string) => {
    setActing(true);
    try {
      const res = await fetch(`/api/items/production_orders/${orderId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error((await res.json())?.errors?.[0]?.message ?? 'Failed');
      setStatus(newStatus);
      notifications.show({ title: 'Updated', message, color: 'green' });
    } catch (err) {
      notifications.show({ title: 'Error', message: err instanceof Error ? err.message : 'Failed', color: 'red' });
    } finally { setActing(false); }
  };

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <div>
          <Title order={2}>Production Order</Title>
          <Text c="dimmed" size="sm">Start the order, record production details, and mark it finished when work is complete.</Text>
        </div>
        {status && <Badge size="lg" color={STATUS_COLORS[status] ?? 'gray'} variant="light">{STATUS_LABELS[status] ?? status}</Badge>}
      </Group>

      {(status === 'ready' || status === 'released') && (
        <Button leftSection={<IconPlayerPlay size={16} />} color="violet" loading={acting} onClick={() => updateStatus('in_progress', 'Production started')}>
          Start Production
        </Button>
      )}

      {status === 'in_progress' && (
        <Button leftSection={<IconCheck size={16} />} color="teal" loading={acting} onClick={() => updateStatus('completed', 'Production completed. A finished goods batch will be created.')}>
          Mark as Finished
        </Button>
      )}

      {status === 'completed' && (
        <Alert color="teal" variant="light">Production is finished. The finished goods batch can now move to QC.</Alert>
      )}

      <CollectionForm collection="production_orders" mode="edit" id={orderId} onSuccess={() => router.push('/production/orders')} onCancel={() => router.push('/production/orders')} />
    </Stack>
  );
}
