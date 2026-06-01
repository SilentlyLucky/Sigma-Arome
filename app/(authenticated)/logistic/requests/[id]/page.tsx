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
      notifications.show({ title: 'Request approved', message: 'Warehouse can now prepare these materials for production.', color: 'green' });
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
          <Text c="dimmed" size="sm">Review the request before Warehouse prepares the materials.</Text>
        </div>
        {status && <Badge size="lg" color={STATUS_COLORS[status] ?? 'gray'} variant="light">{status}</Badge>}
      </Group>

      {status === 'submitted' && (
        <Group>
          <Button leftSection={<IconCheck size={16} />} color="green" loading={approving} onClick={handleApprove}>
            Approve Request
          </Button>
          <Text size="xs" c="dimmed">Approving tells Warehouse to prepare these materials for production.</Text>
        </Group>
      )}

      {status === 'approved' && (
        <Alert icon={<IconInfoCircle size={16} />} color="green" variant="light">
          Request approved. Waiting for Warehouse to send the materials to production.
        </Alert>
      )}

      <Divider label="Requested Materials" labelPosition="left" />

      <CollectionList
        collection="material_request_items"
        enableSort
        filter={{ material_request_id: { _eq: requestId } }}
        fields={['material_id', 'requested_qty', 'unit', 'status', 'delivered_qty', 'received_qty']}
        renderCell={(item, header) => {
          if (header.value === 'material_id') {
            const name = materialNames.get(String(item.material_id ?? ''));
            return name ? <span style={{ fontSize: 'var(--mantine-font-size-sm)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, maxWidth: '100%', display: 'block' }}>{name}</span> : null;
          }
          return null;
        }}
      />

      <Button variant="subtle" onClick={() => router.push('/logistic/requests')}>← Back to Requests</Button>
    </Stack>
  );
}
