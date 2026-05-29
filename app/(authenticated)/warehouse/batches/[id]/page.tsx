'use client';

import { Stack, Title, Text, Group, Badge } from '@mantine/core';
import { CollectionForm } from '@/components/ui/collection-form';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

const STATUS_COLORS: Record<string, string> = {
  qc_pending: 'orange', under_qc: 'blue', approved: 'green', hold: 'yellow',
  rejected: 'red', storage_assigned: 'teal', stored_available: 'green',
  requested: 'grape', issued: 'indigo', consumed: 'dark',
};

export default function BatchDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/items/batches/${id}?fields[]=status`).then(r => r.json()).then(d => setStatus(d?.data?.status ?? null)).catch(() => {});
  }, [id]);

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <div>
          <Title order={2}>Batch Detail</Title>
          <Text c="dimmed" size="sm">View batch information, status, and location.</Text>
        </div>
        {status && <Badge size="lg" color={STATUS_COLORS[status] ?? 'gray'} variant="light">{status.replace(/_/g, ' ')}</Badge>}
      </Group>
      <CollectionForm collection="batches" mode="edit" id={id as string} onSuccess={() => router.push('/warehouse/batches')} onCancel={() => router.push('/warehouse/batches')} />
    </Stack>
  );
}
