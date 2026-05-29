'use client';
import { Stack, Title, Text } from '@mantine/core';
import { CollectionList } from '@/components/ui/collection-list';
export default function ManagerQCPage() {
  return (<Stack gap="md"><div><Title order={2}>QC Status</Title><Text c="dimmed" size="sm">All QC inspections and decisions — read-only overview.</Text></div><CollectionList collection="qc_inspections" enableSearch enableFilter enableSort enableHeaderMenu enableResize fields={['inspection_number', 'batch_id', 'inspection_type', 'decision', 'started_at', 'completed_at']} /></Stack>);
}
