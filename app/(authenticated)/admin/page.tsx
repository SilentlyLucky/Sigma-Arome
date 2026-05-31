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
  Alert,
  RingProgress,
  Box,
  Skeleton,
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
  IconSettings,
} from '@tabler/icons-react';
import { DashboardListLoading } from '@/components/ui/dashboard-loading';
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
  { label: 'Suppliers', icon: IconBuildingFactory2, collection: 'suppliers', color: 'green', href: '/admin/suppliers', description: 'Supplier list' },
  { label: 'Raw Materials', icon: IconFlask, collection: 'raw_materials', color: 'green', href: '/admin/raw-materials', description: 'Materials you buy and store' },
  { label: 'Products', icon: IconPackage, collection: 'products', color: 'violet', href: '/admin/products', description: 'Finished goods you produce' },
  { label: 'Warehouse Locations', icon: IconMapPin, collection: 'warehouse_locations', color: 'orange', href: '/admin/warehouse-locations', description: 'Storage areas and bins' },
  { label: 'Hazard Classes', icon: IconAlertTriangle, collection: 'hazard_classes', color: 'red', href: '/admin/hazard-classes', description: 'Storage safety groups' },
  { label: 'Quality Check Forms', icon: IconChecklist, collection: 'qc_templates', color: 'teal', href: '/admin/qc-templates', description: 'Inspection forms and limits' },
  { label: 'IoT Sensors', icon: IconDeviceDesktopAnalytics, collection: 'iot_sensors', color: 'cyan', href: '/admin/iot-sensors', description: 'Warehouse monitoring sensors' },
];

const REQUIRED_ROLE_COUNT = 7;
const SETUP_DATA_TOTAL = STAT_CARDS.length + 1;

const QUICK_LINKS = [
  { label: 'Users', href: '/admin/users', icon: IconUsers, description: 'Create users and assign roles' },
  { label: 'Roles', href: '/admin/roles', icon: IconShieldCheck, description: 'Review each role' },
  { label: 'Page Access', href: '/admin/permissions', icon: IconShieldCheck, description: 'Choose which pages each role can open' },
  { label: 'Visible Fields', href: '/admin/field-visibility', icon: IconShieldCheck, description: 'Choose which fields each role can see' },
  { label: 'Allowed Actions', href: '/admin/action-permissions', icon: IconShieldCheck, description: 'Choose which buttons each role can use' },
  { label: 'Audit Log', href: '/admin/audit-log', icon: IconFileText, description: 'View all system activity' },
];

function readAggregateCount(data: unknown, primaryKey = 'id'): number {
  const payload = data as {
    data?: Array<{ count?: unknown }>;
    meta?: Record<string, unknown>;
  };
  const raw = payload.data?.[0]?.count;
  if (typeof raw === 'number') return raw;
  if (typeof raw === 'string') return Number(raw) || 0;
  if (raw && typeof raw === 'object') {
    const record = raw as Record<string, unknown>;
    const value = record[primaryKey] ?? record['*'] ?? Object.values(record)[0];
    return Number(value) || 0;
  }
  const metaCount = payload.meta?.filter_count ?? payload.meta?.total_count ?? payload.meta?.total;
  if (typeof metaCount === 'number') return metaCount;
  if (typeof metaCount === 'string') return Number(metaCount) || 0;
  if (Array.isArray(payload.data)) return payload.data.length;
  return 0;
}

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

      // Fetch active user count
      try {
        const res = await fetch('/api/users?filter[status][_eq]=active&aggregate[count]=id');
        if (res.ok) {
          const data = await res.json();
          setUserCount(readAggregateCount(data, 'id'));
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

  const rolesConfigured = (roleCount ?? 0) >= REQUIRED_ROLE_COUNT;
  const setupDataCount = STAT_CARDS.filter((c) => (counts[c.collection] ?? 0) > 0).length + (rolesConfigured ? 1 : 0);
  const setupDataComplete = setupDataCount === SETUP_DATA_TOTAL;
  const setupProgress = Math.round((setupDataCount / SETUP_DATA_TOTAL) * 100);
  const setupChecklist = [
    {
      label: 'Roles configured',
      done: rolesConfigured,
      href: '/admin/roles',
      icon: IconShieldCheck,
      description: `At least ${REQUIRED_ROLE_COUNT} roles configured`,
    },
    ...STAT_CARDS.map((card) => ({
      label: `${card.label} added`,
      done: (counts[card.collection] ?? 0) > 0,
      href: card.href,
      icon: card.icon,
      description: card.description,
    })),
  ];
  const graphRows = [
    {
      label: 'Active Users',
      value: userCount ?? 0,
      target: Math.max(userCount ?? 0, 1),
      color: 'green',
      href: '/admin/users',
      note: 'Users currently allowed to access the system',
    },
    {
      label: 'Roles Configured',
      value: roleCount ?? 0,
      target: REQUIRED_ROLE_COUNT,
      color: 'teal',
      href: '/admin/roles',
      note: `${REQUIRED_ROLE_COUNT} required roles expected`,
    },
    {
      label: 'Setup Data',
      value: setupDataCount,
      target: SETUP_DATA_TOTAL,
      color: setupDataComplete ? 'green' : 'orange',
      href: '/admin',
      note: 'Roles plus required setup areas',
    },
    {
      label: 'Audit Events (24h)',
      value: auditCount ?? 0,
      target: Math.max(auditCount ?? 0, 1),
      color: 'teal',
      href: '/admin/audit-log',
      note: 'System activity recorded in the last 24 hours',
    },
  ];

  return (
    <Stack gap={32}>
      {/* Page Header */}
      <Group justify="space-between" align="center">
        <Group gap={16} align="center">
          <Box
            style={{
              width: 48, height: 48, borderRadius: 12,
              backgroundColor: '#E8F5E9',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <IconSettings size={24} color="#2E7D32" strokeWidth={1.75} />
          </Box>
          <div>
            <Title order={2} fw={700} style={{ color: '#0F172A', lineHeight: 1.2 }}>
              Admin Control Center
            </Title>
            <Text size="sm" style={{ color: '#6B7280', marginTop: 2 }}>
              Manage users, roles, factory setup data, and access settings.
            </Text>
          </div>
        </Group>
        {loading && <Loader size="sm" color="primary" />}
      </Group>

      {/* KPI Cards */}
      <SimpleGrid cols={{ base: 2, sm: 2, md: 4 }} spacing="md">
        <Paper p="lg" withBorder style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <Stack gap={8}>
            <Group justify="space-between" align="flex-start">
              <Text size="xs" fw={600} tt="uppercase" style={{ color: '#9CA3AF', letterSpacing: '0.05em' }}>
                Active Users
              </Text>
              <Box style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconUsers size={18} color="#2E7D32" strokeWidth={1.75} />
              </Box>
            </Group>
            {loading ? (
              <Skeleton height={32} width={64} radius="sm" />
            ) : (
              <Title order={2} fw={700} style={{ color: '#0F172A', lineHeight: 1 }}>{userCount ?? '—'}</Title>
            )}
            <Anchor href="/admin/users" size="xs" fw={500} style={{ color: '#2E7D32' }}>Manage users →</Anchor>
          </Stack>
        </Paper>

        <Paper p="lg" withBorder style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <Stack gap={8}>
            <Group justify="space-between" align="flex-start">
              <Text size="xs" fw={600} tt="uppercase" style={{ color: '#9CA3AF', letterSpacing: '0.05em' }}>
                Roles
              </Text>
              <Box style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconShieldCheck size={18} color="#2E7D32" strokeWidth={1.75} />
              </Box>
            </Group>
            {loading ? (
              <Skeleton height={32} width={64} radius="sm" />
            ) : (
              <Title order={2} fw={700} style={{ color: '#0F172A', lineHeight: 1 }}>{roleCount ?? '—'}</Title>
            )}
            <Anchor href="/admin/roles" size="xs" fw={500} style={{ color: '#2E7D32' }}>Manage roles →</Anchor>
          </Stack>
        </Paper>

        <Paper p="lg" withBorder style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <Stack gap={8}>
            <Group justify="space-between" align="flex-start">
              <Text size="xs" fw={600} tt="uppercase" style={{ color: '#9CA3AF', letterSpacing: '0.05em' }}>
                Setup Data
              </Text>
              <Box style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: setupDataComplete ? '#E8F5E9' : '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconActivity size={18} color={setupDataComplete ? '#2E7D32' : '#D97706'} strokeWidth={1.75} />
              </Box>
            </Group>
            {loading ? (
              <Skeleton height={32} width={112} radius="sm" />
            ) : (
              <Group gap={6} align="center">
                <Title order={2} fw={700} style={{ color: '#0F172A', lineHeight: 1 }}>
                  {setupDataCount}/{SETUP_DATA_TOTAL}
                </Title>
                <Badge size="xs" color={setupDataComplete ? 'primary' : 'yellow'} variant="light">
                  {setupDataComplete ? 'Complete' : 'Incomplete'}
                </Badge>
              </Group>
            )}
            <Text size="xs" style={{ color: '#9CA3AF' }}>Roles plus setup areas</Text>
          </Stack>
        </Paper>

        <Paper p="lg" withBorder style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <Stack gap={8}>
            <Group justify="space-between" align="flex-start">
              <Text size="xs" fw={600} tt="uppercase" style={{ color: '#9CA3AF', letterSpacing: '0.05em' }}>
                Audit (24h)
              </Text>
              <Box style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconFileText size={18} color="#4F46E5" strokeWidth={1.75} />
              </Box>
            </Group>
            {loading ? (
              <Skeleton height={32} width={80} radius="sm" />
            ) : (
              <Title order={2} fw={700} style={{ color: '#0F172A', lineHeight: 1 }}>{auditCount ?? '—'}</Title>
            )}
            <Anchor href="/admin/audit-log" size="xs" fw={500} style={{ color: '#2E7D32' }}>View audit log →</Anchor>
          </Stack>
        </Paper>
      </SimpleGrid>

      {/* Setup Graph */}
      <Paper p="lg" withBorder style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <Group justify="space-between" align="flex-start" mb={24}>
          <div>
            <Text fw={600} size="sm" style={{ color: '#0F172A' }}>System Readiness</Text>
            <Text size="xs" style={{ color: '#6B7280', marginTop: 2 }}>
              A health check across users, roles, setup data, and recent system activity.
            </Text>
          </div>
          <Badge color={setupDataComplete ? 'primary' : 'yellow'} variant="light" size="sm">
            {setupDataCount}/{SETUP_DATA_TOTAL} areas ready
          </Badge>
        </Group>

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
          <Group gap="xl" align="center" wrap="nowrap">
            <RingProgress
              size={160}
              thickness={14}
              roundCaps
              sections={[{ value: setupProgress, color: setupDataComplete ? '#2E7D32' : '#D97706' }]}
              label={
                <Stack gap={0} align="center">
                  <Text fw={800} size="xl" style={{ color: '#0F172A' }}>{setupProgress}%</Text>
                  <Text size="xs" style={{ color: '#9CA3AF' }}>ready</Text>
                </Stack>
              }
            />
            <Stack gap={6}>
              <Text fw={600} style={{ color: '#0F172A' }}>Setup readiness</Text>
              <Text size="sm" style={{ color: '#6B7280' }}>
                {setupDataComplete
                  ? 'All required setup areas are ready.'
                  : `${SETUP_DATA_TOTAL - setupDataCount} area${SETUP_DATA_TOTAL - setupDataCount === 1 ? '' : 's'} still need attention.`}
              </Text>
              <Anchor href="#setup-checklist" size="sm" fw={500} style={{ color: '#2E7D32' }}>
                Review checklist →
              </Anchor>
            </Stack>
          </Group>

          <Stack gap={16}>
            {graphRows.map((row) => {
              const pct = row.target === 0 ? 0 : Math.min(100, Math.round((row.value / row.target) * 100));
              const barColor = row.color === 'green' ? '#2E7D32' : row.color === 'teal' ? '#0EA5E9' : row.color === 'orange' ? '#D97706' : '#4F46E5';
              return (
                <Box key={row.label}>
                  <Group justify="space-between" mb={6} wrap="nowrap">
                    <Stack gap={1}>
                      <Text size="xs" fw={600} style={{ color: '#4B5563' }}>{row.label}</Text>
                      <Text size="xs" style={{ color: '#9CA3AF' }}>{row.note}</Text>
                    </Stack>
                    <Anchor href={row.href} size="sm" fw={700} style={{ color: '#2E7D32', flexShrink: 0 }}>
                      {row.label === 'Setup Data' ? `${row.value}/${row.target}` : row.value}
                    </Anchor>
                  </Group>
                  <Box h={6} style={{ backgroundColor: '#E5E7EB', borderRadius: 999, overflow: 'hidden' }}>
                    <Box
                      h="100%"
                      w={`${Math.max(row.value > 0 ? 6 : 0, pct)}%`}
                      style={{ borderRadius: 999, transition: 'width 220ms ease', backgroundColor: barColor }}
                    />
                  </Box>
                </Box>
              );
            })}
          </Stack>
        </SimpleGrid>
      </Paper>

      {/* Factory Setup Overview */}
      <div>
        <Text fw={600} size="sm" mb={12} style={{ color: '#0F172A' }}>Factory Setup Overview</Text>
        <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="sm">
          {STAT_CARDS.map((card) => (
            <Paper key={card.collection} p="md" withBorder style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <Group justify="space-between" wrap="nowrap" align="flex-start">
                <Stack gap={4}>
                  <Text size="xs" fw={600} tt="uppercase" lineClamp={1} style={{ color: '#9CA3AF', letterSpacing: '0.04em' }}>
                    {card.label}
                  </Text>
                  <Group gap={6} align="center">
                    {loading ? (
                      <Skeleton height={28} width={70} radius="sm" />
                    ) : (
                      <>
                        <Title order={3} fw={700} style={{ color: '#0F172A' }}>
                          {counts[card.collection] ?? '—'}
                        </Title>
                        {(counts[card.collection] ?? 0) === 0 && (
                          <Badge size="xs" color="yellow" variant="light">Empty</Badge>
                        )}
                      </>
                    )}
                  </Group>
                </Stack>
                <ThemeIcon size="md" radius={8} variant="light" color={card.color}>
                  <card.icon size={16} />
                </ThemeIcon>
              </Group>
              <Anchor href={card.href} size="xs" fw={500} mt={8} display="block" style={{ color: '#2E7D32' }}>
                {card.description} →
              </Anchor>
            </Paper>
          ))}
        </SimpleGrid>
      </div>

      {/* Setup Exceptions */}
      <Box>
        <Text fw={600} size="sm" mb={12} style={{ color: '#0F172A' }}>Setup Exceptions</Text>
        {loading ? (
          <DashboardListLoading rows={3} />
        ) : (() => {
          const emptyAreas = setupChecklist.filter((item) => !item.done);
          return emptyAreas.length === 0 ? (
            <Alert
              color="primary"
              variant="light"
              radius="lg"
              icon={<IconCircleCheck size={16} />}
              style={{ borderColor: '#C8E6C9' }}
            >
              <Text size="sm" style={{ color: '#0F172A' }}>
                All required setup areas have at least one record. Your system is fully configured.
              </Text>
            </Alert>
          ) : (
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="sm">
              {emptyAreas.map(area => (
                <Paper key={area.label} p="md" withBorder style={{ borderColor: '#FDE68A', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                  <Group justify="space-between" wrap="nowrap" align="flex-start">
                    <Stack gap={2}>
                      <Text size="sm" fw={600} style={{ color: '#0F172A' }}>{area.label}</Text>
                      <Text size="xs" style={{ color: '#6B7280' }}>{area.description} — no records yet</Text>
                    </Stack>
                    <Box style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <area.icon size={14} color="#D97706" />
                    </Box>
                  </Group>
                  <Anchor href={area.href} size="xs" fw={500} mt={8} display="block" style={{ color: '#D97706' }}>
                    Set up now →
                  </Anchor>
                </Paper>
              ))}
            </SimpleGrid>
          );
        })()}
      </Box>

      {/* Quick Links & Checklist */}
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        <Paper p="lg" withBorder style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <Text fw={600} size="sm" mb={16} style={{ color: '#0F172A' }}>Configuration Quick Links</Text>
          <Stack gap={12}>
            {QUICK_LINKS.map((link) => (
              <Group key={link.href} gap={10} align="center">
                <Box style={{ width: 28, height: 28, borderRadius: 7, backgroundColor: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <link.icon size={14} color="#2E7D32" strokeWidth={1.75} />
                </Box>
                <div style={{ minWidth: 0 }}>
                  <Anchor href={link.href} size="sm" fw={500} style={{ color: '#0F172A' }}>{link.label}</Anchor>
                  <Text size="xs" style={{ color: '#9CA3AF' }}>{link.description}</Text>
                </div>
              </Group>
            ))}
          </Stack>
        </Paper>

        <Paper id="setup-checklist" p="lg" withBorder style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <Text fw={600} size="sm" mb={16} style={{ color: '#0F172A' }}>Setup Checklist</Text>
          <Stack gap={10}>
            {setupChecklist.map((item) => (
              <Group key={item.label} gap={10} align="center">
                <Box style={{
                  width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                  backgroundColor: item.done ? '#E8F5E9' : '#F3F5F3',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {item.done && <IconCircleCheck size={13} color="#2E7D32" />}
                </Box>
                <Text size="sm" style={{ color: item.done ? '#1F2937' : '#9CA3AF' }}>
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
