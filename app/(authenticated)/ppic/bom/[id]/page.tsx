'use client';

import { Stack, Title, Text, Divider } from '@mantine/core';
import { CollectionForm } from '@/components/ui/collection-form';
import { CollectionList } from '@/components/ui/collection-list';
import { useRouter, useParams } from 'next/navigation';
import { useNameLookup } from '@/lib/hooks/useNameLookup';

export default function BOMDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const materialNames = useNameLookup('raw_materials');

  return (
    <Stack gap="md">
      <div>
        <Title order={2}>BOM / Formula Detail</Title>
        <Text c="dimmed" size="sm">Edit formula header and manage line items (materials + quantities per unit).</Text>
      </div>

      <CollectionForm
        collection="boms"
        mode="edit"
        id={id}
        excludeFields={['name']}
        onSuccess={() => router.push('/ppic/bom')}
        onCancel={() => router.push('/ppic/bom')}
      />

      <Divider label="Formula Items — Materials Required" labelPosition="left" />

      <CollectionList
        collection="bom_items"
        enableCreate
        enableDelete
        enableSort
        filter={{ bom_id: { _eq: id } }}
        fields={['material_id', 'qty_per_unit', 'unit']}
        onCreate={() => router.push(`/ppic/bom/${id}/items/create`)}
        onItemClick={(item) => router.push(`/ppic/bom/${id}/items/${item.id}`)}
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
