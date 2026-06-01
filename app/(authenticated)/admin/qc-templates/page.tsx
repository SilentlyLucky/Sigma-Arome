'use client';

import { Group, Stack, Text, Title } from '@mantine/core';
import { CollectionList } from '@/components/ui/collection-list';
import { useRouter } from 'next/navigation';
import { useNameLookup } from '@/lib/hooks/useNameLookup';

export default function QCTemplatesPage() {
  const router = useRouter();
  const materialNames = useNameLookup('raw_materials');
  const productNames = useNameLookup('products');

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-end" gap="md">
        <div>
          <Title order={2}>Quality Check Forms</Title>
          <Text c="dimmed" size="sm">Manage inspection forms and acceptable limits for raw materials and finished products.</Text>
        </div>
        <Text c="dimmed" size="xs" ta="right" maw={580} style={{ lineHeight: 1.45 }}>
          💡 Right-click column header to sort, align, or hide. Drag the ⋮⋮ grip to reorder columns. Drag edges to resize.
        </Text>
      </Group>
      <CollectionList
        collection="qc_templates"
        enableSearch
        enableFilter
        enableCreate
        enableDelete
        enableHeaderMenu
        enableResize
        enableReorder
        enableSort
        fields={['name', 'target_type', 'material_id', 'product_id', 'status']}
        onCreate={() => router.push('/admin/qc-templates/create')}
        onItemClick={(item) => router.push(`/admin/qc-templates/${item.id}`)}
        renderCell={(item, header) => {
          if (header.value === 'material_id') {
            const name = materialNames.get(String(item.material_id ?? ''));
            return name ? <span style={{ fontSize: 'var(--mantine-font-size-sm)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, maxWidth: '100%', display: 'block' }}>{name}</span> : null;
          }
          if (header.value === 'product_id') {
            const name = productNames.get(String(item.product_id ?? ''));
            return name ? <span style={{ fontSize: 'var(--mantine-font-size-sm)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, maxWidth: '100%', display: 'block' }}>{name}</span> : null;
          }
          return null;
        }}
      />
    </Stack>
  );
}
