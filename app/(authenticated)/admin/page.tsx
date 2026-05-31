'use client';

import {
  Paper,
  Text,
  Title,
  Group,
  Stack,
  ThemeIcon,
  SimpleGrid,
  Badge,
  Anchor,
  Loader,
  Divider,
  Alert,
} from '@mantine/core';
import {
  IconUsers,
  IconBuildingFactory2,
  IconFlask,
  IconPackage,
  IconMapPin,
  IconAlertTriangle,
  IconChecklist,
  IconDeviceDesktopAnalytics,
  IconShieldCheck,
  IconFileText,
  IconActivity,
  IconCircleCheck,
} from '@tabler/icons-react';
import { useEffect, useState } from 'react';

/**
 * Admin Dashboard
 * KPIs per PRD Section 17.1:
 * - Active users
 * - Roles configured
 * - Master data completion
 * - Warehouse locations configured
 * - Materials/products configured
 * - Recent admin changes
 * - Audit log count
 */

interface StatCard {
  label: string;
  icon: typeof IconUsers;
  collection: string;
  color: string;
  href: string;
  description: string;
}

const STAT_CARDS: StatCard[] = [
  { label: 'Suppliers', icon: IconBuildingFactory2, collection: 'suppliers', color: 'blue', href: '/admin/suppliers', description: 'Supplier list' },
  { label: 'Raw Materials', icon: IconFlask, collection: 'raw_materials', color: 'green', href: '/admin/raw-materials', description: 'Materials you buy and store' },
  { label: 'Products', icon: IconPackage, collection: 'products', color: 'violet', href: '/admin/products', description: 'Finished goods you produce' },
  { label: 'Warehouse Locations', icon: IconMapPin, collection: 'warehouse_locations', color: 'orange', href: '/admin/warehouse-locations', description: 'Storage areas and bins' },
  { label: 'Hazard Classes', icon: IconAlertTriangle, collection: 'hazard_classes', color: 'red', href: '/admin/hazard-classes', description: 'Storage safety groups' },
  { label: 'Quality Check Forms', icon: IconChecklist, collection: 'qc_templates', color: 'teal', href: '/admin/qc-templates', description: 'Inspection forms and limits' },
  { label: 'IoT Sensors', icon: IconDeviceDesktopAnalytics, collection: 'iot_sensors', color: 'cyan', href: '/admin/iot-sensors', description: 'Warehouse monitoring sensors' },
];

const QUICK_LINKS = [
  { label: 'Users', href: '/admin/users', icon: IconUsers, description: 'Create users and assign roles' },
  { label: 'Roles', href: '/admin/roles', icon: IconShieldCheck, description: 'Review each role' },
  { label: 'Page Access', href: '/admin/permissions', icon: IconShieldCheck, description: 'Choose which pages each role can open' },
  { label: 'Visible Fields', href: '/admin/field-visibility', icon: IconShieldCheck, description: 'Choose which fields each role can see' },
  { label: 'Allowed Actions', href: '/admin/action-permissions', icon: IconShieldCheck, description: 'Choose which buttons each role can use' },
  { label: 'Audit Log', href: '/admin/audit-log', icon: IconFileText, description: 'View all system activity' },
];

export default function AdminDashboard() {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [userCount, setUserCount] = useState<number | null>(null);
  const [roleCount, setRoleCount] = useState<number | null>(null);
  const [auditCount, setAuditCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCounts() {
      setLoading(true);
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const results: Record<string, number> = await fetch('/api/batch-counts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          counts: [
            ...STAT_CARDS.map((card) => ({ key: card.collection, collection: card.collection })),
            { key: 'audit24h', collection: 'daas_activity', filter: { timestamp: { _gte: since } } },
          ],
        }),
      }).then(async (res) => (res.ok ? ((await res.json())?.counts ?? {}) : {})).catch(() => ({}));
      setCounts(results);

      // Fetch user count
      try {
        const res = await fetch('/api/users?aggregate[count]=*');
        if (res.ok) {
          const data = await res.json();
          setUserCount(data?.data?.[0]?.count ?? 0);
        }
      } catch {
        setUserCount(0);
      }

      // Fetch role count
      try {
        const res = await fetch('/api/roles');
        if (res.ok) {
          const data = await res.json();
          setRoleCount((data?.data ?? []).length);
        }
      } catch {
        setRoleCount(0);
      }

      setAuditCount(Number(results.audit24h ?? 0));

      setLoading(false);
    }
    fetchCounts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const masterDataComplete = STAT_CARDS.every((c) => (counts[c.collection] ?? 0) > 0);

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-start">
        <div>
          <Title order={2}>Admin Control Center</Title>
          <Text c="dimmed" size="sm">
            Manage users, roles, factory setup data, and access settings.
          </Text>
        </div>
        {loading && <Loader size="sm" />}
      </Group>

      {/* PRD 17.1 KPI Cards */}
      <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="md">
        <Paper p="md" radius="md" withBorder>
          <Group justify="space-between">
            <Stack gap={4}>
              <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Active Users</Text>
              <Title order={3}>{userCount ?? '—'}</Title>
            </Stack>
            <ThemeIcon size="xl" radius="md" variant="light" color="blue">
              <IconUsers size={24} />
            </ThemeIcon>
          </Group>
          <Anchor href="/admin/users" size="xs" c="dimmed" mt={4} display="block">Manage users →</Anchor>
        </Paper>

        <Paper p="md" radius="md" withBorder>
          <Group justify="space-between">
            <Stack gap={4}>
              <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Roles Configured</Text>
              <Title order={3}>{roleCount ?? '—'}</Title>
            </Stack>
            <ThemeIcon size="xl" radius="md" variant="light" color="grape">
              <IconShieldCheck size={24} />
            </ThemeIcon>
          </Group>
          <Anchor href="/admin/roles" size="xs" c="dimmed" mt={4} display="block">Manage roles →</Anchor>
        </Paper>

        <Paper p="md" radius="md" withBorder>
          <Group justify="space-between">
            <Stack gap={4}>
              <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Setup Data</Text>
              <Group gap={4} align="center">
                <Title order={3}>{STAT_CARDS.filter((c) => (counts[c.collection] ?? 0) > 0).length}/{STAT_CARDS.length}</Title>
                <Badge size="xs" color={masterDataComplete ? 'green' : 'orange'} variant="light">
                  {masterDataComplete ? 'Complete' : 'Incomplete'}
                </Badge>
              </Group>
            </Stack>
            <ThemeIcon size="xl" radius="md" variant="light" color={masterDataComplete ? 'green' : 'orange'}>
              <IconActivity size={24} />
            </ThemeIcon>
          </Group>
          <Text size="xs" c="dimmed" mt={4}>Setup areas with at least one record</Text>
        </Paper>

        <Paper p="md" radius="md" withBorder>
          <Group justify="space-between">
            <Stack gap={4}>
              <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Audit Events (24h)</Text>
              <Title order={3}>{auditCount ?? '—'}</Title>
            </Stack>
            <ThemeIcon size="xl" radius="md" variant="light" color="teal">
              <IconFileText size={24} />
            </ThemeIcon>
          </Group>
          <Anchor href="/admin/audit-log" size="xs" c="dimmed" mt={4} display="block">View audit log →</Anchor>
        </Paper>
      </SimpleGrid>

      {/* Master Data Counts */}
      <div>
        <Text fw={600} size="sm" mb="sm">Factory Setup Overview</Text>
        <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="sm">
          {STAT_CARDS.map((card) => (
            <Paper key={card.collection} p="sm" radius="md" withBorder>
              <Group justify="space-between" wrap="nowrap">
                <Stack gap={2}>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700} lineClamp={1}>
                    {card.label}
                  </Text>
                  <Group gap={4} align="center">
                    <Title order={4}>{counts[card.collection] ?? '—'}</Title>
                    {(counts[card.collection] ?? 0) === 0 && (
                      <Badge size="xs" color="orange" variant="light">Empty</Badge>
                    )}
                  </Group>
                </Stack>
                <ThemeIcon size="lg" radius="md" variant="light" color={card.color}>
                  <card.icon size={18} />
                </ThemeIcon>
              </Group>
              <Anchor href={card.href} size="xs" c="dimmed" mt={4} display="block">
                {card.description}
              </Anchor>
            </Paper>
          ))}
        </SimpleGrid>
      </div>

      {/* Setup Exceptions */}
      <Divider label="Setup Exceptions — Areas Needing Attention" labelPosition="left" />
      {!loading && (() => {
        const emptyAreas = STAT_CARDS.filter(c => (counts[c.collection] ?? 0) === 0);
        return emptyAreas.length === 0 ? (
          <Alert color="green" variant="light" icon={<IconCircleCheck size={16} />}>
            All required setup areas have at least one record. Your system is fully configured.
          </Alert>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="sm">
            {emptyAreas.map(area => (
              <Paper key={area.collection} p="sm" radius="md" withBorder style={{ borderColor: 'var(--mantine-color-orange-4)' }}>
                <Group justify="space-between" wrap="nowrap">
                  <Stack gap={2}>
                    <Text size="sm" fw={600}>{area.label}</Text>
                    <Text size="xs" c="dimmed">{area.description} — no records yet</Text>
                  </Stack>
                  <ThemeIcon size="md" radius="md" variant="light" color="orange">
                    <area.icon size={16} />
                  </ThemeIcon>
                </Group>
                <Anchor href={area.href} size="xs" mt={4} display="block" c="orange">Set up now →</Anchor>
              </Paper>
            ))}
          </SimpleGrid>
        );
      })()}

      {/* Quick Links */}
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        <Paper p="md" radius="md" withBorder>
          <Title order={4} mb="sm">Configuration Quick Links</Title>
          <Stack gap="xs">
          {QUICK_LINKS.map((link) => (
            <Group key={link.href} gap="xs">
              <link.icon size={14} />
              <Anchor href={link.href} size="sm">{link.label}</Anchor>
              <Text size="xs" c="dimmed">— {link.description}</Text>
            </Group>
          ))}
          </Stack>
        </Paper>

        <Paper p="md" radius="md" withBorder>
          <Title order={4} mb="sm">Setup Checklist</Title>
          <Stack gap="xs">
            {[
              { label: 'Users created', done: (userCount ?? 0) > 0 },
              { label: 'Roles configured', done: (roleCount ?? 0) >= 7 },
              { label: 'Suppliers added', done: (counts['suppliers'] ?? 0) > 0 },
              { label: 'Raw materials added', done: (counts['raw_materials'] ?? 0) > 0 },
              { label: 'Products added', done: (counts['products'] ?? 0) > 0 },
              { label: 'Warehouse locations added', done: (counts['warehouse_locations'] ?? 0) > 0 },
              { label: 'Quality check forms added', done: (counts['qc_templates'] ?? 0) > 0 },
              { label: 'IoT sensors configured', done: (counts['iot_sensors'] ?? 0) > 0 },
            ].map((item) => (
              <Group key={item.label} gap="xs">
                <Badge size="xs" color={item.done ? 'green' : 'gray'} variant="light">
                  {item.done ? 'Done' : 'Todo'}
                </Badge>
                <Text size="sm" c={item.done ? undefined : 'dimmed'}>
                  {item.label}
                </Text>
              </Group>
            ))}
          </Stack>
        </Paper>
      </SimpleGrid>
    </Stack>
  );
}
