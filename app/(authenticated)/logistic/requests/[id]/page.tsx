'use client';

import { Stack, Title, Text, Group, Badge, Button, Divider, Alert } from '@mantine/core';
import { CollectionList } from '@/components/ui/collection-list';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconInfoCircle } from '@tabler/icons-react';
import { useNameLookup } from '@/lib/hooks/useNameLookup';

const STATUS_COLORS: Record<string, string> = { draft: 'gray', submitted: 'blue', approved: 'green', partially_issued: 'yellow', issued: 'teal', cancelled: 'red' };

export default function LogisticRequestDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const requestId = id as string;
  const [status, setStatus] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);
  const materialNames = useNameLookup('raw_materials');

  useEffect(() => {
    fetch(`/api/items/material_requests/${requestId}?fields[]=status`)
      .then(r => r.json()).then(d => setStatus(d?.data?.status ?? null)).catch(() => {});
  }, [requestId]);

  const handleApprove = async () => {
    setApproving(true);
    try {
      const res = await fetch(`/api/items/material_requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      });
      if (!res.ok) throw new Error((await res.json())?.errors?.[0]?.message ?? 'Failed');
      setStatus('approved');
      notifications.show({ title: 'Approved', message: 'Request approved — Warehouse can now issue material', color: 'green' });
    } catch (err) {
      notifications.show({ title: 'Error', message: err instanceof Error ? err.message : 'Failed', color: 'red' });
    } finally {
      setApproving(false);
    }
  };

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <div>
          <Title order={2}>Material Request Detail</Title>
          <Text c="dimmed" size="sm">Review request and approve for Warehouse to issue.</Text>
        </div>
        {status && <Badge size="lg" color={STATUS_COLORS[status] ?? 'gray'} variant="light">{status}</Badge>}
      </Group>

      {status === 'submitted' && (
        <Group>
          <Button leftSection={<IconCheck size={16} />} color="green" loading={approving} onClick={handleApprove}>
            Approve Request
          </Button>
          <Text size="xs" c="dimmed">Approving allows Warehouse to issue the requested materials.</Text>
        </Group>
      )}

      {status === 'approved' && (
        <Alert icon={<IconInfoCircle size={16} />} color="green" variant="light">
          Request approved. Waiting for Warehouse to issue materials.
        </Alert>
      )}

      <Divider label="Request Items" labelPosition="left" />

      <CollectionList
        collection="material_request_items"
        enableSort
        filter={{ material_request_id: { _eq: requestId } }}
        fields={['material_id', 'requested_qty', 'approved_qty', 'issued_qty', 'unit', 'shortage_qty']}
        renderCell={(item, header) => {
          if (header.value === 'material_id') {
            const name = materialNames.get(String(item.material_id ?? ''));
            return name ? <span style={{ fontSize: 'var(--mantine-font-size-sm)' }}>{name}</span> : null;
          }
          return null;
        }}
      />

      <Button variant="subtle" onClick={() => router.push('/logistic/requests')}>← Back to Queue</Button>
    </Stack>
  );
}
