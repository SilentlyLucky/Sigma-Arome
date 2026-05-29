'use client';
import { Stack, Title, Text } from '@mantine/core';
import { CollectionList } from '@/components/ui/collection-list';
export default function ManagerOrdersPage() {
  return (<Stack gap="md"><div><Title order={2}>Raw Material Orders</Title><Text c="dimmed" size="sm">All PPIC raw material orders — read-only overview.</Text></div><CollectionList collection="raw_material_orders" enableSearch enableFilter enableSort enableHeaderMenu enableResize fields={['order_number', 'material_id', 'supplier_id', 'ordered_qty', 'unit', 'status', 'priority', 'expected_arrival_date']} /></Stack>);
}
