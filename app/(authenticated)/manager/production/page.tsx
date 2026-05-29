'use client';
import { Stack, Title, Text } from '@mantine/core';
import { CollectionList } from '@/components/ui/collection-list';
export default function ManagerProductionPage() {
  return (<Stack gap="md"><div><Title order={2}>Production Orders</Title><Text c="dimmed" size="sm">All production orders — read-only overview.</Text></div><CollectionList collection="production_orders" enableSearch enableFilter enableSort enableHeaderMenu enableResize fields={['order_number', 'product_id', 'planned_qty', 'unit', 'status', 'priority', 'due_date']} /></Stack>);
}
