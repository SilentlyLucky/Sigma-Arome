'use client';

import {
  SimpleGrid, Paper, Text, Title, Group, Stack, ThemeIcon,
  Loader, Anchor, Divider, Badge, Alert, Table,
} from '@mantine/core';
import {
  IconClipboardList, IconTransferOut, IconClock, IconPackage,
  IconAlertTriangle, IconCircleCheck, IconChevronRight,
} from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import React from 'react';
import { useRouter } from 'next/navigation';

function Pipeline({ stages }: { stages: { label: string; count: number; color: string }[] }) {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'stretch', overflowX: 'auto', paddingBottom: 4 }}>
      {stages.map((s, i) => (
        <React.Fragment key={s.label}>
          <div style={{
            flex: '1 1 0', minWidth: 70, textAlign: 'center', padding: '10px 6px',
            background: `var(--mantine-color-${s.color}-0)`,
            border: `1px solid var(--mantine-color-${s.color}-3)`,
            borderRadius: 8,
          }}>
            <Text size="xl" fw={700} c={s.count > 0 ? s.color : 'dimmed'}>{s.count}</Text>
            <Text size="xs" c="dimmed" lineClamp={2}>{s.label}</Text>
          </div>
          {i < stages.length - 1 && (
            <div style={{ display: 'flex', alignItems: 'center', color: 'var(--mantine-color-gray-4)', padding: '0 2px' }}>
              <IconChevronRight size={14} />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

interface MaterialRequest { id: string; request_number: string; status: string; production_order_id: string | null }

export default function LogisticDashboard() {
  const router = useRouter();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [pendingRequests, setPendingRequests] = useState<MaterialRequest[]>([]);
  const [approvedRequests, setApprovedRequests] = useState<MaterialRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [c, pending, approved] = await Promise.all([
        fetch('/api/batch-counts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            counts: [
              { key: 'submitted', collection: 'material_requests', filter: { status: { _eq: 'submitted' } } },
              { key: 'approved', collection: 'material_requests', filter: { status: { _eq: 'approved' } } },
              { key: 'partialIssued', collection: 'material_requests', filter: { status: { _eq: 'partially_issued' } } },
              { key: 'issued', collection: 'material_requests', filter: { status: { _eq: 'issued' } } },
              { key: 'fgApproved', collection: 'batches', filter: { batch_type: { _eq: 'finished_product' }, status: { _eq: 'approved' } } },
            ],
          }),
        }).then(async r => r.ok ? (await r.json())?.counts ?? {} : {}).catch(() => ({})),

        fetch('/api/items/material_requests?filter[status][_eq]=submitted&fields[]=id&fields[]=request_number&fields[]=status&fields[]=production_order_id&limit=6&sort[]=id')
          .then(async r => r.ok ? (await r.json())?.data ?? [] : []).catch(() => []),

        fetch('/api/items/material_requests?filter[status][_eq]=approved&fields[]=id&fields[]=request_number&fields[]=status&fields[]=production_order_id&limit=6&sort[]=id')
          .then(async r => r.ok ? (await r.json())?.data ?? [] : []).catch(() => []),
      ]);

      setCounts(c);
      setPendingRequests(pending);
      setApprovedRequests(approved);
      setLoading(false);
    }
    load();
  }, []);

  const n = (k: string) => counts[k] ?? 0;
  const inProgress = n('partialIssued') + n('issued');

  return (
    <Stack gap="lg">
      <div>
        <Title order={2}>Logistics Coordination</Title>
        <Text c="dimmed" size="sm">Review material requests, coordinate sending materials to production, and handle finished goods storage.</Text>
      </div>

      {loading ? <Group justify="center" py="xl"><Loader /></Group> : (
        <>
          {/* ── Priority Cards ─────────────────────────────────────────────── */}
          <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
            <Paper p="md" radius="md" withBorder style={{ cursor: 'pointer', borderColor: n('submitted') > 0 ? 'var(--mantine-color-orange-4)' : undefined }} onClick={() => router.push('/logistic/requests')}>
              <Group justify="space-between" wrap="nowrap">
                <Stack gap={2}>
                  <Text size="xs" c="dimmed" fw={600} tt="uppercase">Requests to Review</Text>
                  <Title order={2} c={n('submitted') > 0 ? 'orange' : undefined}>{n('submitted')}</Title>
                  <Text size="xs" c="dimmed">Awaiting approval</Text>
                </Stack>
                <ThemeIcon size="xl" radius="md" variant={n('submitted') > 0 ? 'filled' : 'light'} color="orange"><IconClipboardList size={22} /></ThemeIcon>
              </Group>
            </Paper>

            <Paper p="md" radius="md" withBorder style={{ cursor: 'pointer', borderColor: n('approved') > 0 ? 'var(--mantine-color-blue-4)' : undefined }} onClick={() => router.push('/logistic/issue-monitor')}>
              <Group justify="space-between" wrap="nowrap">
                <Stack gap={2}>
                  <Text size="xs" c="dimmed" fw={600} tt="uppercase">Approved — Ready to Send</Text>
                  <Title order={2} c={n('approved') > 0 ? 'blue' : undefined}>{n('approved')}</Title>
                  <Text size="xs" c="dimmed">Waiting for pick & send</Text>
                </Stack>
                <ThemeIcon size="xl" radius="md" variant={n('approved') > 0 ? 'filled' : 'light'} color="blue"><IconTransferOut size={22} /></ThemeIcon>
              </Group>
            </Paper>

            <Paper p="md" radius="md" withBorder style={{ cursor: 'pointer' }} onClick={() => router.push('/logistic/issue-monitor')}>
              <Group justify="space-between" wrap="nowrap">
                <Stack gap={2}>
                  <Text size="xs" c="dimmed" fw={600} tt="uppercase">Materials Being Sent</Text>
                  <Title order={2} c="green">{inProgress}</Title>
                  <Text size="xs" c="dimmed">Partially or fully issued</Text>
                </Stack>
                <ThemeIcon size="xl" radius="md" variant="light" color="green"><IconClock size={22} /></ThemeIcon>
              </Group>
            </Paper>

            <Paper p="md" radius="md" withBorder style={{ cursor: 'pointer', borderColor: n('fgApproved') > 0 ? 'var(--mantine-color-teal-4)' : undefined }} onClick={() => router.push('/logistic/fg-putaway')}>
              <Group justify="space-between" wrap="nowrap">
                <Stack gap={2}>
                  <Text size="xs" c="dimmed" fw={600} tt="uppercase">Finished Goods to Store</Text>
                  <Title order={2} c={n('fgApproved') > 0 ? 'teal' : undefined}>{n('fgApproved')}</Title>
                  <Text size="xs" c="dimmed">QC-cleared, awaiting putaway</Text>
                </Stack>
                <ThemeIcon size="xl" radius="md" variant={n('fgApproved') > 0 ? 'filled' : 'light'} color="teal"><IconPackage size={22} /></ThemeIcon>
              </Group>
            </Paper>
          </SimpleGrid>

          {/* ── Request Pipeline ─────────────────────────────────────────────── */}
          <Paper p="md" radius="md" withBorder>
            <Text fw={600} size="sm" mb="sm">Material Request Pipeline</Text>
            <Pipeline stages={[
              { label: 'Submitted', count: n('submitted'), color: 'orange' },
              { label: 'Approved', count: n('approved'), color: 'blue' },
              { label: 'Being Sent', count: n('partialIssued'), color: 'cyan' },
              { label: 'Completed', count: n('issued'), color: 'green' },
            ]} />
          </Paper>

          {/* ── Request Queues ───────────────────────────────────────────────── */}
          <Divider label="Action Queues" labelPosition="left" />
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <Paper p="md" radius="md" withBorder>
              <Group justify="space-between" mb="sm">
                <Text fw={600} size="sm">Requests Awaiting Approval</Text>
                <Anchor href="/logistic/requests" size="xs">View all →</Anchor>
              </Group>
              {pendingRequests.length === 0 ? (
                <Alert color="green" variant="light" icon={<IconCircleCheck size={14} />}>
                  No material requests waiting for review.
                </Alert>
              ) : (
                <Table withTableBorder>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Request</Table.Th>
                      <Table.Th>Status</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {pendingRequests.map(r => (
                      <Table.Tr key={r.id} style={{ cursor: 'pointer' }} onClick={() => router.push(`/logistic/requests/${r.id}`)}>
                        <Table.Td><Text size="sm" fw={500}>{r.request_number}</Text></Table.Td>
                        <Table.Td><Badge size="xs" color="orange" variant="light">Waiting for review</Badge></Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              )}
            </Paper>

            <Paper p="md" radius="md" withBorder>
              <Group justify="space-between" mb="sm">
                <Text fw={600} size="sm">Approved — Ready to Pick & Send</Text>
                <Anchor href="/logistic/issue-monitor" size="xs">View all →</Anchor>
              </Group>
              {approvedRequests.length === 0 ? (
                <Alert color="green" variant="light" icon={<IconCircleCheck size={14} />}>
                  No approved requests waiting to be sent.
                </Alert>
              ) : (
                <Table withTableBorder>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Request</Table.Th>
                      <Table.Th>Status</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {approvedRequests.map(r => (
                      <Table.Tr key={r.id} style={{ cursor: 'pointer' }} onClick={() => router.push(`/logistic/requests/${r.id}`)}>
                        <Table.Td><Text size="sm" fw={500}>{r.request_number}</Text></Table.Td>
                        <Table.Td><Badge size="xs" color="blue" variant="light">Ready to send</Badge></Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              )}
            </Paper>
          </SimpleGrid>
        </>
      )}
    </Stack>
  );
}
