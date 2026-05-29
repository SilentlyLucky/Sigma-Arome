'use client';
import { Stack, Title, Text } from '@mantine/core';
import { CollectionList } from '@/components/ui/collection-list';
export default function ManagerInventoryPage() {
  return (<Stack gap="md"><div><Title order={2}>Inventory — All Batches</Title><Text c="dimmed" size="sm">All batches across the factory — raw material and finished product.</Text></div><CollectionList collection="batches" enableSearch enableFilter enableSort enableHeaderMenu enableResize fields={['batch_number', 'material_id', 'batch_type', 'qty', 'unit', 'status', 'current_location_id', 'expiry_date']} /></Stack>);
}
