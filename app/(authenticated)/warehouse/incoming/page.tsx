'use client';

import { Stack, Title, Text, Group, Badge, Button, Paper, Table, Loader, Alert, Anchor } from '@mantine/core';
import { IconTruckDelivery, IconCircleCheck } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Order {
  id: string;
  order_number: string;
  material_id: string;
  supplier_id: string | null;
  ordered_qty: number;
  unit: string;
  expected_arrival_date: string | null;
  priority: string;
  status: string;
}

const STATUS_COLORS: Record<string, string> = {
  ordered: 'blue',
  partially_received: 'yellow',
};
const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'red', high: 'orange', normal: 'blue', low: 'gray',
};

function isPastExpectedDate(date: string | null) {
  if (!date) return false;

  const expected = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expected.setHours(0, 0, 0, 0);

  return expected < today;
}

export default function ExpectedIncomingPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [materialNames, setMaterialNames] = useState<Record<string, string>>({});
  const [supplierNames, setSupplierNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch(
        '/api/items/raw_material_orders' +
        '?filter[status][_in]=ordered,partially_received' +
        '&fields[]=id&fields[]=order_number&fields[]=material_id&fields[]=supplier_id' +
        '&fields[]=ordered_qty&fields[]=unit&fields[]=expected_arrival_date&fields[]=priority&fields[]=status' +
        '&sort[]=expected_arrival_date&limit=100'
      );
      const data: Order[] = res.ok ? (await res.json())?.data ?? [] : [];
      setOrders(data);

      const matIds = [...new Set(data.map(o => o.material_id).filter(Boolean))];
      const supIds = [...new Set(data.map(o => o.supplier_id).filter(Boolean))] as string[];

      const [matsRes, supsRes] = await Promise.all([
        matIds.length > 0
          ? fetch(`/api/items/raw_materials?filter[id][_in]=${matIds.join(',')}&fields[]=id&fields[]=name&limit=200`)
              .then(r => r.json()).catch(() => ({ data: [] }))
          : Promise.resolve({ data: [] }),
        supIds.length > 0
          ? fetch(`/api/items/suppliers?filter[id][_in]=${supIds.join(',')}&fields[]=id&fields[]=supplier_name&limit=100`)
              .then(r => r.json()).catch(() => ({ data: [] }))
          : Promise.resolve({ data: [] }),
      ]);

      const mats: Record<string, string> = {};
      for (const m of matsRes?.data ?? []) mats[m.id] = m.name;
      setMaterialNames(mats);

      const sups: Record<string, string> = {};
      for (const s of supsRes?.data ?? []) sups[s.id] = s.supplier_name;
      setSupplierNames(sups);

      setLoading(false);
    }
    load();
  }, []);

  const overdueOrders = orders.filter(o => isPastExpectedDate(o.expected_arrival_date));

  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Expected Deliveries</Title>
        <Text c="dimmed" size="sm">
          Raw material orders on the way. Click <strong>Receive</strong> to record delivery when materials arrive.
        </Text>
      </div>

      {overdueOrders.length > 0 && (
        <Alert color="orange" variant="light" icon={<IconTruckDelivery size={16} />}>
          <Text fw={500}>{overdueOrders.length} order{overdueOrders.length !== 1 ? 's are' : ' is'} past the expected arrival date.</Text>
          <Text size="xs" c="dimmed">Follow up with suppliers for these overdue deliveries.</Text>
        </Alert>
      )}

      {loading ? (
        <Group justify="center" py="xl"><Loader /></Group>
      ) : orders.length === 0 ? (
        <Alert color="green" variant="light" icon={<IconCircleCheck size={16} />}>
          No pending deliveries right now.
        </Alert>
      ) : (
        <Paper radius="md" withBorder>
          <Table withTableBorder highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Order</Table.Th>
                <Table.Th>Material</Table.Th>
                <Table.Th>Supplier</Table.Th>
                <Table.Th>Qty</Table.Th>
                <Table.Th>Expected</Table.Th>
                <Table.Th>Priority</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Action</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {orders.map(o => {
                const isOverdue = isPastExpectedDate(o.expected_arrival_date);
                return (
                  <Table.Tr key={o.id}>
                    <Table.Td>
                      <Text size="sm" fw={500} style={{ fontFamily: 'monospace' }}>{o.order_number}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{materialNames[o.material_id] ?? o.material_id.slice(0, 8)}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">{o.supplier_id ? (supplierNames[o.supplier_id] ?? '—') : '—'}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{o.ordered_qty} {o.unit}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c={isOverdue ? 'red' : undefined} fw={isOverdue ? 600 : undefined}>
                        {o.expected_arrival_date
                          ? new Date(o.expected_arrival_date).toLocaleDateString()
                          : '—'}
                        {isOverdue && ' (overdue)'}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge size="xs" color={PRIORITY_COLORS[o.priority] ?? 'gray'} variant="light">
                        {o.priority}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Badge size="xs" color={STATUS_COLORS[o.status] ?? 'gray'} variant="light">
                        {o.status === 'partially_received' ? 'Partial' : 'Ordered'}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Button
                        size="compact-xs"
                        color="teal"
                        variant="filled"
                        leftSection={<IconTruckDelivery size={12} />}
                        onClick={() => router.push(`/warehouse/receive?order_id=${o.id}`)}
                      >
                        Receive
                      </Button>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </Paper>
      )}

      <Group justify="flex-end">
        <Anchor href="/warehouse/receive" size="xs">Record unplanned delivery →</Anchor>
      </Group>
    </Stack>
  );
}
