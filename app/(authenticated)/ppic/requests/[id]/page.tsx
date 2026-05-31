'use client';

import { Stack, Title, Text, Group, Badge, Button, Divider, Alert } from '@mantine/core';
import { CollectionForm } from '@/components/ui/collection-form';
import { CollectionList } from '@/components/ui/collection-list';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { notifications } from '@mantine/notifications';
import { IconInfoCircle } from '@tabler/icons-react';
import { useNameLookup } from '@/lib/hooks/useNameLookup';

const STATUS_COLORS: Record<string, string> = {
  draft: 'gray', submitted: 'blue', approved: 'green',
  partially_issued: 'yellow', issued: 'teal', cancelled: 'red',
};
const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft', submitted: 'Submitted to Warehouse', approved: 'Approved',
  partially_issued: 'Partially Sent', issued: 'Fully Sent', cancelled: 'Cancelled',
};

export default function MaterialRequestDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const materialNames = useNameLookup('raw_materials');

  useEffect(() => {
    fetch(`/api/items/material_requests/${id}?fields[]=status`)
      .then((r) => r.json())
      .then((d) => setStatus(d?.data?.status ?? null))
      .catch(() => {});
  }, [id]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/items/material_requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'submitted' }),
      });
      if (!res.ok) throw new Error('Submit failed');
      setStatus('submitted');
      notifications.show({ title: 'Submitted', message: 'Material request sent to Warehouse.', color: 'green' });
    } catch (err) {
      notifications.show({ title: 'Error', message: err instanceof Error ? err.message : 'Failed', color: 'red' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-start">
        <div>
          <Title order={2}>Material Request Detail</Title>
          <Text c="dimmed" size="sm">Review the materials needed and track what Warehouse has sent.</Text>
        </div>
        {status && (
          <Badge size="lg" color={STATUS_COLORS[status]} variant="light">
            {STATUS_LABELS[status] ?? status}
          </Badge>
        )}
      </Group>

      {status === 'draft' && (
        <Group>
          <Button color="blue" loading={submitting} onClick={handleSubmit}>
            Submit to Warehouse
          </Button>
          <Text size="xs" c="dimmed">Once submitted, Warehouse can approve the request and send materials to production.</Text>
        </Group>
      )}

      {status && status !== 'draft' && status !== 'cancelled' && (
        <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
          This request has been submitted. Warehouse will approve it and send materials to production. You can track progress below.
        </Alert>
      )}

      <CollectionForm
        collection="material_requests"
        mode="edit"
        id={id}
        onSuccess={() => router.push('/ppic/requests')}
        onCancel={() => router.push('/ppic/requests')}
      />

      <Divider label="Request Items — Materials Needed" labelPosition="left" />

      <CollectionList
        collection="material_request_items"
        enableCreate={status === 'draft'}
        enableDelete={status === 'draft'}
        enableSort
        filter={{ material_request_id: { _eq: id } }}
        fields={['material_id', 'requested_qty', 'unit', 'approved_qty', 'issued_qty', 'shortage_qty']}
        onCreate={() => router.push(`/ppic/requests/${id}/items/create`)}
        onItemClick={(item) => router.push(`/ppic/requests/${id}/items/${item.id}`)}
        renderCell={(item, header) => {
          if (header.value === 'material_id') {
            const name = materialNames.get(String(item.material_id ?? ''));
            return name ? <span style={{ fontSize: 'var(--mantine-font-size-sm)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, maxWidth: '100%', display: 'block' }}>{name}</span> : null;
          }
          return null;
        }}
      />
    </Stack>
  );
}
