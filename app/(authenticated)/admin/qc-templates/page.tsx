'use client';

import { Stack, Title, Text } from '@mantine/core';
import { CollectionList } from '@/components/ui/collection-list';
import { useRouter } from 'next/navigation';

export default function QCTemplatesPage() {
  const router = useRouter();
  return (
    <Stack gap="md">
      <div>
        <Title order={2}>QC Templates</Title>
        <Text c="dimmed" size="sm">Manage QC parameter templates for raw materials and finished products.</Text>
        <Text c="dimmed" size="xs" mt={4}>💡 Right-click column header to sort, align, or hide. Drag the ⋮⋮ grip to reorder columns. Drag edges to resize.</Text>
      </div>
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
      />
    </Stack>
  );
}
