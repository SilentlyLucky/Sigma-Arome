'use client';

import {
  Anchor,
  Badge,
  Box,
  Button,
  Group,
  Paper,
  RingProgress,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import {
  BarChart3,
  Building2,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Eye,
  FileText,
  FlaskConical,
  LockKeyhole,
  MapPin,
  Package,
  RadioTower,
  Settings,
  Settings2,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  UserCog,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface StatCard {
  label: string;
  icon: LucideIcon;
  collection: string;
  accent: string;
  soft: string;
  href: string;
  description: string;
}

interface QuickLink {
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
}

const REQUIRED_ROLE_COUNT = 7;

const SETUP_CARDS: StatCard[] = [
  { label: 'Suppliers', icon: Building2, collection: 'suppliers', accent: '#1F8F3A', soft: '#EAF6EC', href: '/admin/suppliers', description: 'Supplier list' },
  { label: 'Raw Materials', icon: FlaskConical, collection: 'raw_materials', accent: '#14813A', soft: '#EAF6EC', href: '/admin/raw-materials', description: 'Materials you buy and store' },
  { label: 'Products', icon: Package, collection: 'products', accent: '#6D5DF6', soft: '#F0EEFF', href: '/admin/products', description: 'Finished goods you produce' },
  { label: 'Warehouse Locations', icon: MapPin, collection: 'warehouse_locations', accent: '#F97316', soft: '#FFF2E8', href: '/admin/warehouse-locations', description: 'Storage areas and bins' },
  { label: 'Hazard Classes', icon: TriangleAlert, collection: 'hazard_classes', accent: '#E5484D', soft: '#FFF1F1', href: '/admin/hazard-classes', description: 'Storage safety groups' },
  { label: 'Quality Check Forms', icon: ClipboardCheck, collection: 'qc_templates', accent: '#0891B2', soft: '#EAF8FB', href: '/admin/qc-templates', description: 'Inspection forms and limits' },
  { label: 'IoT Sensors', icon: RadioTower, collection: 'iot_sensors', accent: '#0EA5E9', soft: '#ECF8FF', href: '/admin/iot-sensors', description: 'Monitoring sensors' },
];

const QUICK_LINKS: QuickLink[] = [
  { label: 'Users', href: '/admin/users', icon: Users, description: 'Create users and assign roles' },
  { label: 'Roles', href: '/admin/roles', icon: UserCog, description: 'Review each role' },
  { label: 'Page Access', href: '/admin/permissions', icon: LockKeyhole, description: 'Review which pages each role can open' },
  { label: 'Visible Fields', href: '/admin/field-visibility', icon: Eye, description: 'Choose which fields each role can see' },
  { label: 'Allowed Actions', href: '/admin/action-permissions', icon: Sparkles, description: 'Choose which actions each role can use' },
  { label: 'Audit Log', href: '/admin/audit-log', icon: FileText, description: 'View system activity' },
];

const SETUP_DATA_TOTAL = SETUP_CARDS.length + 1;

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

function formatNumber(value: number | null) {
  if (value === null) return '-';
  return value.toLocaleString();
}

function glassCardStyle(extra?: React.CSSProperties): React.CSSProperties {
  return {
    background: 'rgba(255, 255, 255, 0.9)',
    border: '1px solid rgba(218, 226, 214, 0.9)',
    boxShadow: '0 10px 30px rgba(16, 24, 40, 0.045)',
    backdropFilter: 'blur(10px)',
    ...extra,
  };
}

function OverviewCard({
  title,
  value,
  label,
  secondary,
  href,
  actionLabel,
  icon: Icon,
  accent,
  soft,
  loading,
  badge,
}: {
  title: string;
  value: string;
  label: string;
  secondary: string;
  href: string;
  actionLabel: string;
  icon: LucideIcon;
  accent: string;
  soft: string;
  loading: boolean;
  badge?: string;
}) {
  return (
    <Anchor href={href} underline="never" className="role-clickable-anchor">
      <Paper p={22} radius={20} h="100%" className="role-clickable-card" style={glassCardStyle({ minHeight: 174 })}>
        <Stack h="100%" justify="space-between" gap={18}>
          <Group gap={16} align="flex-start" wrap="nowrap">
            <Box
              style={{
                width: 56,
                height: 56,
                borderRadius: 18,
                backgroundColor: soft,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon size={27} color={accent} strokeWidth={2.15} />
            </Box>
            <Stack gap={5} style={{ minWidth: 0 }}>
              <Text fw={800} size="sm" style={{ color: '#102033' }}>
                {title}
              </Text>
              {loading ? (
                <Skeleton height={32} width={74} radius="sm" />
              ) : (
                <Text fw={900} style={{ color: accent, fontSize: 34, lineHeight: 1, letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums' }}>
                  {value}
                </Text>
              )}
              <Text size="sm" fw={600} style={{ color: '#17212F' }}>
                {label}
              </Text>
              {badge ? (
                <Badge size="sm" radius="md" style={{ alignSelf: 'flex-start', backgroundColor: soft, color: accent }}>
                  {badge}
                </Badge>
              ) : (
                <Text size="xs" fw={600} style={{ color: '#5F6C7B' }}>
                  <Box component="span" mr={5} style={{ color: accent }}>●</Box>
                  {secondary}
                </Text>
              )}
            </Stack>
          </Group>
          <Text size="sm" fw={800} style={{ color: '#1F8F3A' }}>
            {actionLabel} →
          </Text>
        </Stack>
      </Paper>
    </Anchor>
  );
}

function InsightRow({
  icon: Icon,
  title,
  badge,
  description,
  href,
  accent,
  soft,
}: {
  icon: LucideIcon;
  title: string;
  badge: string;
  description: string;
  href: string;
  accent: string;
  soft: string;
}) {
  return (
    <Anchor href={href} underline="never" className="role-clickable-anchor">
      <Group py={16} gap={16} wrap="nowrap" className="role-clickable-row" style={{ borderBottom: '1px solid #E8EEE6' }}>
        <Box
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            backgroundColor: soft,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon size={23} color={accent} strokeWidth={2.2} />
        </Box>
        <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
          <Group gap={8} wrap="nowrap">
            <Text fw={850} size="sm" style={{ color: '#102033' }}>
              {title}
            </Text>
            <Badge size="xs" radius="md" style={{ backgroundColor: soft, color: accent, flexShrink: 0 }}>
              {badge}
            </Badge>
          </Group>
          <Text size="sm" style={{ color: '#5F6C7B', lineHeight: 1.45 }}>
            {description}
          </Text>
        </Stack>
        <ChevronRight size={19} color="#243246" />
      </Group>
    </Anchor>
  );
}

function SetupTile({ card, count, loading }: { card: StatCard; count: number; loading: boolean }) {
  const Icon = card.icon;
  return (
    <Anchor href={card.href} underline="never" className="role-clickable-anchor">
      <Box
        p={16}
        className="role-clickable-row"
        style={{
          minHeight: 122,
          borderRight: '1px solid #E8EEE6',
          borderBottom: '1px solid #E8EEE6',
          transition: 'background-color 150ms ease',
        }}
      >
        <Group gap={12} align="flex-start" wrap="nowrap">
          <Box
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              backgroundColor: card.soft,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon size={19} color={card.accent} strokeWidth={2.15} />
          </Box>
          <Stack gap={3} style={{ minWidth: 0 }}>
            <Text size="sm" fw={850} style={{ color: '#102033' }} lineClamp={1}>
              {card.label}
            </Text>
            {loading ? (
              <Skeleton height={24} width={42} radius="sm" />
            ) : (
              <Text fw={900} style={{ color: '#102033', fontSize: 20, lineHeight: 1 }}>
                {count}
              </Text>
            )}
            <Text size="xs" fw={700} style={{ color: '#1F8F3A', lineHeight: 1.35 }}>
              {card.description} →
            </Text>
          </Stack>
        </Group>
      </Box>
    </Anchor>
  );
}

function QuickLinkTile({ link }: { link: QuickLink }) {
  const Icon = link.icon;
  return (
    <Anchor href={link.href} underline="never" className="role-clickable-anchor">
      <Group
        p={14}
        gap={12}
        wrap="nowrap"
        className="role-clickable-row"
        style={{
          borderRadius: 14,
          transition: 'background-color 150ms ease',
        }}
      >
        <Box
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            backgroundColor: '#EAF6EC',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon size={18} color="#1F8F3A" strokeWidth={2.15} />
        </Box>
        <Stack gap={1} style={{ flex: 1, minWidth: 0 }}>
          <Text fw={850} size="sm" style={{ color: '#102033' }}>
            {link.label}
          </Text>
          <Text size="xs" style={{ color: '#5F6C7B' }} lineClamp={1}>
            {link.description}
          </Text>
        </Stack>
        <ChevronRight size={18} color="#243246" />
      </Group>
    </Anchor>
  );
}

export default function AdminDashboard() {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [userCount, setUserCount] = useState<number | null>(null);
  const [roleCount, setRoleCount] = useState<number | null>(null);
  const [auditCount, setAuditCount] = useState<number | null>(null);
  const [accessCount, setAccessCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCounts() {
      setLoading(true);
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const setupCounts = await fetch('/api/batch-counts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          counts: [
            ...SETUP_CARDS.map((card) => ({ key: card.collection, collection: card.collection })),
            { key: 'audit24h', collection: 'daas_activity', filter: { timestamp: { _gte: since } } },
          ],
        }),
      }).then(async (res) => (res.ok ? ((await res.json())?.counts ?? {}) : {})).catch(() => ({}));

      const [users, roles, permissions, access] = await Promise.all([
        fetch('/api/users?filter[status][_eq]=active&aggregate[count]=id').then(async (res) => (res.ok ? readAggregateCount(await res.json(), 'id') : 0)).catch(() => 0),
        fetch('/api/roles').then(async (res) => (res.ok ? ((await res.json())?.data ?? []).length : 0)).catch(() => 0),
        fetch('/api/permissions').then(async (res) => (res.ok ? ((await res.json())?.data ?? []).length : 0)).catch(() => 0),
        fetch('/api/access').then(async (res) => (res.ok ? ((await res.json())?.data ?? []).length : 0)).catch(() => 0),
      ]);

      setCounts(setupCounts);
      setUserCount(users);
      setRoleCount(roles);
      setAccessCount(permissions + access);
      setAuditCount(Number(setupCounts.audit24h ?? 0));
      setLoading(false);
    }

    fetchCounts();
  }, []);

  const rolesConfigured = (roleCount ?? 0) >= REQUIRED_ROLE_COUNT;
  const setupDataCount = SETUP_CARDS.filter((card) => (counts[card.collection] ?? 0) > 0).length + (rolesConfigured ? 1 : 0);
  const setupComplete = setupDataCount === SETUP_DATA_TOTAL;
  const setupProgress = Math.round((setupDataCount / SETUP_DATA_TOTAL) * 100);
  const setupChecklist = useMemo(
    () => [
      {
        label: 'Roles configured',
        description: `${roleCount ?? 0} user roles configured`,
        href: '/admin/roles',
        done: rolesConfigured,
      },
      ...SETUP_CARDS.slice(0, 3).map((card) => ({
        label: `${card.label} added`,
        description: card.description,
        href: card.href,
        done: (counts[card.collection] ?? 0) > 0,
      })),
    ],
    [counts, roleCount, rolesConfigured],
  );

  return (
    <Box>
      <Stack gap={24}>
          <Group gap={16} align="center">
            <Box
              style={{
                width: 56,
                height: 56,
                borderRadius: 18,
                backgroundColor: '#EAF6EC',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 12px 28px rgba(31, 143, 58, 0.12)',
              }}
            >
              <Settings size={28} color="#1F8F3A" strokeWidth={2.2} />
            </Box>
            <Stack gap={3}>
              <Title order={1} style={{ color: '#102033', fontSize: 'clamp(30px, 3vw, 38px)', lineHeight: 1.1, letterSpacing: '-0.045em', fontWeight: 900 }}>
                Admin Control Center
              </Title>
              <Text size="md" fw={500} style={{ color: '#5F6C7B', lineHeight: 1.45 }}>
                Manage users, roles, factory setup data, and access settings.
              </Text>
            </Stack>
          </Group>

          <Stack gap={12}>
            <Text fw={850} size="md" style={{ color: '#102033' }}>
              System Overview
            </Text>
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing={16}>
              <OverviewCard
                title="Users"
                value={formatNumber(userCount)}
                label="Active users"
                secondary="0 users without role"
                href="/admin/users"
                actionLabel="Manage users"
                icon={Users}
                accent="#1F8F3A"
                soft="#EAF6EC"
                loading={loading}
              />
              <OverviewCard
                title="Roles"
                value={formatNumber(roleCount)}
                label="Total roles"
                secondary="0 permission issues"
                href="/admin/roles"
                actionLabel="Manage roles"
                icon={ShieldCheck}
                accent="#1F8F3A"
                soft="#EAF6EC"
                loading={loading}
              />
              <OverviewCard
                title="Access Configuration"
                value={formatNumber(accessCount)}
                label="Configured items"
                secondary="Pages • Fields • Actions"
                href="/admin/permissions"
                actionLabel="Manage access"
                icon={LockKeyhole}
                accent="#1F8F3A"
                soft="#EAF6EC"
                loading={loading}
              />
              <OverviewCard
                title="Audit Activity (24h)"
                value={formatNumber(auditCount)}
                label="Events recorded"
                secondary=""
                href="/admin/audit-log"
                actionLabel="View audit log"
                icon={BarChart3}
                accent="#6D5DF6"
                soft="#F0EEFF"
                loading={loading}
                badge="Normal volume"
              />
            </SimpleGrid>
          </Stack>

          <SimpleGrid cols={{ base: 1, lg: 2 }} spacing={16} style={{ gridTemplateColumns: 'minmax(0, 3fr) minmax(340px, 2fr)' }}>
            <Paper p={24} radius={20} style={glassCardStyle()}>
              <Group justify="space-between" align="flex-start" mb={24}>
                <Stack gap={3}>
                  <Text fw={850} size="md" style={{ color: '#102033' }}>System Readiness</Text>
                  <Text size="sm" style={{ color: '#5F6C7B' }}>
                    Setup areas that determine whether the operational flow is ready to run.
                  </Text>
                </Stack>
              </Group>

              <SimpleGrid cols={{ base: 1, md: 2 }} spacing={24}>
                <Group gap={24} wrap="nowrap" align="center">
                  <RingProgress
                    size={170}
                    thickness={14}
                    roundCaps
                    sections={[{ value: setupProgress, color: setupComplete ? '#1F8F3A' : '#F97316' }]}
                    label={
                      <Stack gap={0} align="center">
                        <Text fw={900} style={{ color: '#102033', fontSize: 31, letterSpacing: '-0.04em' }}>{setupProgress}%</Text>
                        <Text size="sm" fw={700} style={{ color: '#5F6C7B' }}>Ready</Text>
                      </Stack>
                    }
                  />
                  <Stack gap={12}>
                    <Stack gap={4}>
                      <Text fw={850} size="lg" style={{ color: '#102033' }}>
                        {setupComplete ? 'All setup areas are ready.' : 'Some setup areas need attention.'}
                      </Text>
                      <Text size="sm" style={{ color: '#5F6C7B', lineHeight: 1.55 }}>
                        {setupComplete
                          ? 'Excellent! Your factory setup is complete and all required data is configured.'
                          : `${SETUP_DATA_TOTAL - setupDataCount} setup area${SETUP_DATA_TOTAL - setupDataCount === 1 ? '' : 's'} still need to be completed.`}
                      </Text>
                    </Stack>
                    <Button
                      component="a"
                      href="/admin"
                      variant="outline"
                      color="green"
                      radius="md"
                      leftSection={<ClipboardCheck size={16} />}
                      style={{ alignSelf: 'flex-start', fontWeight: 800 }}
                    >
                      Review Checklist
                    </Button>
                  </Stack>
                </Group>

                <Stack gap={12}>
                  <Text size="xs" fw={900} tt="uppercase" style={{ color: '#1F8F3A', letterSpacing: '0.06em' }}>
                    Ready setup areas ({setupDataCount}/{SETUP_DATA_TOTAL})
                  </Text>
                  {setupChecklist.map((item) => (
                    <Anchor key={item.label} href={item.href} underline="never" className="role-clickable-anchor">
                      <Group gap={10} wrap="nowrap" align="flex-start" className="role-clickable-row" p={6} style={{ borderRadius: 10 }}>
                        <CheckCircle2 size={17} color={item.done ? '#1F8F3A' : '#8B97A7'} strokeWidth={2.3} style={{ marginTop: 2, flexShrink: 0 }} />
                        <Stack gap={1}>
                          <Text fw={850} size="sm" style={{ color: '#102033' }}>{item.label}</Text>
                          <Text size="xs" style={{ color: '#5F6C7B' }}>{item.description}</Text>
                        </Stack>
                      </Group>
                    </Anchor>
                  ))}
                  <Anchor href="/admin" size="sm" fw={850} mt={4} style={{ color: '#1F8F3A' }}>
                    View all setup areas →
                  </Anchor>
                </Stack>
              </SimpleGrid>
            </Paper>

            <Paper p={24} radius={20} style={glassCardStyle()}>
              <Stack gap={0}>
                <Stack gap={3} mb={8}>
                  <Text fw={850} size="md" style={{ color: '#102033' }}>Admin Insights</Text>
                  <Text size="sm" style={{ color: '#5F6C7B' }}>
                    Key insights and activities to keep your system secure and reliable.
                  </Text>
                </Stack>
                <InsightRow
                  icon={CheckCircle2}
                  title={setupComplete ? 'Factory setup is ready for operations' : 'Factory setup needs attention'}
                  badge="Monitor"
                  description={setupComplete ? 'Required roles and setup areas have records. Keep reviewing change trends via the audit log.' : 'Some required setup areas are still incomplete. Finish them before running a full demo flow.'}
                  href="/admin"
                  accent="#1F8F3A"
                  soft="#EAF6EC"
                />
                <InsightRow
                  icon={Users}
                  title="User access is active"
                  badge="Review users"
                  description={`${formatNumber(userCount)} active users can access the system. Confirm each user has the correct role.`}
                  href="/admin/users"
                  accent="#2563EB"
                  soft="#EEF4FF"
                />
                <InsightRow
                  icon={Settings2}
                  title="Audit trail is recording system activity"
                  badge="View audit"
                  description={`${formatNumber(auditCount)} events recorded in the last 24 hours. Review spikes after permission or master data changes.`}
                  href="/admin/audit-log"
                  accent="#6D5DF6"
                  soft="#F0EEFF"
                />
              </Stack>
            </Paper>
          </SimpleGrid>

          <SimpleGrid cols={{ base: 1, lg: 2 }} spacing={16} style={{ gridTemplateColumns: 'minmax(0, 3fr) minmax(340px, 2fr)' }}>
            <Paper radius={20} style={glassCardStyle({ overflow: 'hidden' })}>
              <Stack gap={2} p={20} pb={8}>
                <Text fw={850} size="md" style={{ color: '#102033' }}>Factory Setup Overview</Text>
                <Text size="sm" style={{ color: '#5F6C7B' }}>
                  Master data and configuration used across the factory.
                </Text>
              </Stack>
              <SimpleGrid cols={{ base: 1, sm: 2, xl: 4 }} spacing={0}>
                {SETUP_CARDS.map((card) => (
                  <SetupTile key={card.collection} card={card} count={counts[card.collection] ?? 0} loading={loading} />
                ))}
              </SimpleGrid>
            </Paper>

            <Paper p={20} radius={20} style={glassCardStyle()}>
              <Stack gap={2} mb={10}>
                <Text fw={850} size="md" style={{ color: '#102033' }}>Configuration Quick Links</Text>
                <Text size="sm" style={{ color: '#5F6C7B' }}>
                  Jump to the most commonly used configuration pages.
                </Text>
              </Stack>
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing={4}>
                {QUICK_LINKS.map((link) => (
                  <QuickLinkTile key={link.href} link={link} />
                ))}
              </SimpleGrid>
            </Paper>
          </SimpleGrid>
      </Stack>
    </Box>
  );
}
