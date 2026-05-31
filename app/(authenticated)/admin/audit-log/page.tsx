'use client';

import { Alert, Badge, Box, Group, Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { CollectionList } from '@/components/ui/collection-list';
import type { Header } from '@/components/ui/vtable-types';
import { Activity, CheckCircle2, Clock3, FileText, Info, Lock, ShieldCheck, UserRound } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import './audit-log.css';

interface UserInfo {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  roleName: string | null;
}

interface ActivityItem {
  action?: string | null;
  collection?: string | null;
  item?: string | null;
  user_id?: string | null;
  timestamp?: string | null;
  ip?: string | null;
}

interface AuditStats {
  total: number;
  today: number;
  uniqueUsers: number;
  lastEvent: string | null;
  clientIp: string | null;
}

const ROLE_ROUTE_MAP: Record<string, string> = {
  '00000000-0000-0000-0000-000000000001': 'Admin',
};

const MINI_BARS = [34, 50, 42, 64, 54, 76, 47, 66, 58, 82, 70, 88];

function formatTime(value: string | null) {
  if (!value) return 'No activity yet';
  return new Date(value).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function formatDate(value: string | null) {
  if (!value) return 'Waiting for first event';
  return new Date(value).toLocaleDateString();
}

function statNumber(value: number) {
  return value.toLocaleString();
}

function ActionBadge({ action }: { action: string }) {
  const normalized = action.toLowerCase();
  const tone =
    normalized.includes('delete') ? 'red' :
    normalized.includes('update') || normalized.includes('edit') ? 'yellow' :
    normalized.includes('create') ? 'green' : 'gray';

  return (
    <Badge color={tone} variant="light" size="sm" tt="lowercase" radius="sm">
      {action}
    </Badge>
  );
}

export default function AuditLogPage() {
  const [userLabels, setUserLabels] = useState<Record<string, string>>({});
  const [stats, setStats] = useState<AuditStats>({
    total: 0,
    today: 0,
    uniqueUsers: 0,
    lastEvent: null,
    clientIp: null,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const usersRes = await fetch('/api/users?fields[]=id&fields[]=first_name&fields[]=last_name&fields[]=email&limit=200');
        if (!usersRes.ok) return;
        const usersData = await usersRes.json();
        const users: UserInfo[] = (usersData?.data ?? []).map((u: Record<string, unknown>) => ({
          id: String(u.id ?? ''),
          first_name: u.first_name as string | null,
          last_name: u.last_name as string | null,
          email: u.email as string | null,
          roleName: null,
        }));

        const rolesRes = await fetch('/api/items/daas_user_roles?fields[]=user_id&fields[]=role_id&limit=500');
        const rolesData = rolesRes.ok ? await rolesRes.json() : { data: [] };
        const userRoleMap: Record<string, string[]> = {};
        for (const row of (rolesData?.data ?? [])) {
          const uid = String(row.user_id ?? '');
          if (!userRoleMap[uid]) userRoleMap[uid] = [];
          userRoleMap[uid].push(String(row.role_id ?? ''));
        }

        const roleNamesRes = await fetch('/api/roles?fields[]=id&fields[]=name&limit=50');
        const roleNamesData = roleNamesRes.ok ? await roleNamesRes.json() : { data: [] };
        const roleNameMap: Record<string, string> = { ...ROLE_ROUTE_MAP };
        for (const r of (roleNamesData?.data ?? [])) {
          roleNameMap[String(r.id ?? '')] = String(r.name ?? '');
        }

        const accessRes = await fetch('/api/items/app_user_access?fields[]=user_id&fields[]=role_key&limit=200');
        const accessData = accessRes.ok ? await accessRes.json() : { data: [] };
        const accessMap: Record<string, string> = {};
        for (const row of (accessData?.data ?? [])) {
          accessMap[String(row.user_id ?? '')] = String(row.role_key ?? '');
        }

        const labels: Record<string, string> = {};
        for (const user of users) {
          const name = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.email || user.id.slice(0, 8);
          const roleKey = accessMap[user.id];
          let roleName = '';
          if (roleKey) {
            roleName = roleKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          } else {
            const roleIds = userRoleMap[user.id] ?? [];
            roleName = roleIds.map(rid => roleNameMap[rid]).filter(Boolean)[0] ?? '';
          }
          labels[user.id] = roleName ? `${roleName} (${name})` : name;
        }
        setUserLabels(labels);
      } catch {
        // Non-fatal: table can still show shortened IDs.
      }
    };
    load();
  }, []);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [countsRes, lastEventRes, recentUsersRes, ipRes] = await Promise.all([
          fetch('/api/batch-counts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              counts: [
                { key: 'total', collection: 'daas_activity' },
                { key: 'today', collection: 'daas_activity', filter: { timestamp: { _gte: today.toISOString() } } },
              ],
            }),
          }),
          fetch('/api/items/daas_activity?fields[]=timestamp&limit=1&sort=-timestamp'),
          fetch('/api/items/daas_activity?fields[]=user_id&limit=200&sort=-timestamp'),
          fetch('/api/client-ip'),
        ]);

        const counts = countsRes.ok ? ((await countsRes.json())?.counts ?? {}) : {};
        const lastEventData = lastEventRes.ok ? ((await lastEventRes.json())?.data ?? []) : [];
        const recentUsersData: ActivityItem[] = recentUsersRes.ok ? ((await recentUsersRes.json())?.data ?? []) : [];
        const ipData = ipRes.ok ? await ipRes.json() : {};

        const uniqueUserIds = new Set(recentUsersData.map(item => item.user_id).filter(Boolean));

        setStats({
          total: Number(counts.total ?? 0),
          today: Number(counts.today ?? 0),
          uniqueUsers: uniqueUserIds.size,
          lastEvent: (lastEventData[0] as ActivityItem | undefined)?.timestamp ?? null,
          clientIp: typeof ipData.ip === 'string' ? ipData.ip : null,
        });
      } catch {
        // Keep zero-state cards if stats cannot load.
      }
    };
    loadStats();
  }, []);

  const cardData = useMemo(() => ([
    {
      label: 'Total Events',
      value: statNumber(stats.total),
      note: 'All time',
      icon: FileText,
      visual: 'ring',
      accent: '#1F9D4C',
    },
    {
      label: 'Today',
      value: statNumber(stats.today),
      note: new Date().toLocaleDateString(),
      icon: Activity,
      visual: 'bars',
      accent: '#219653',
    },
    {
      label: 'Unique Admins',
      value: statNumber(stats.uniqueUsers),
      note: 'Active in recent events',
      icon: UserRound,
      visual: 'people',
      accent: '#17833B',
    },
    {
      label: 'Last Audit',
      value: formatTime(stats.lastEvent),
      note: formatDate(stats.lastEvent),
      icon: Clock3,
      visual: 'timeline',
      accent: '#168A42',
    },
    {
      label: 'IP Tracker',
      value: stats.clientIp ?? 'Detecting…',
      note: stats.clientIp ? 'Current session IP' : 'Check proxy headers',
      icon: ShieldCheck,
      visual: 'shield',
      accent: '#0F7A38',
    },
  ]), [stats]);

  const renderCell = (item: ActivityItem, header: Header) => {
    if (header.value === 'action') {
      return <ActionBadge action={String(item.action ?? 'event')} />;
    }

    if (header.value === 'user_id') {
      const uid = String(item.user_id ?? '');
      const label = userLabels[uid];
      return (
        <Text size="sm" style={{ whiteSpace: 'normal', wordBreak: 'break-word', color: '#1E293B', fontWeight: 500 }}>
          {label || `${uid.slice(0, 8)}...`}
        </Text>
      );
    }

    if (header.value === 'ip') {
      const ip = String(item.ip ?? '').trim();
      return ip ? (
        <Badge variant="light" color="green" radius="sm" size="sm">{ip}</Badge>
      ) : (
        <Text size="sm" c="dimmed">Waiting for next tracked event</Text>
      );
    }

    return null;
  };

  return (
    <Stack gap="lg" className="audit-dashboard">
      <Group justify="space-between" align="flex-start" className="audit-hero">
        <Group gap="md" align="center">
          <Box className="audit-hero-icon">
            <FileText size={24} />
          </Box>
          <div>
            <Title order={2} className="audit-title">Audit Log</Title>
            <Text size="sm" className="audit-subtitle">
              System activity log, recorded automatically for review and traceability.
            </Text>
          </div>
        </Group>
        <Badge leftSection={<Lock size={13} />} variant="light" color="gray" radius="md" size="lg">
          Read-only
        </Badge>
      </Group>

      <Alert icon={<Info size={18} />} color="blue" variant="light" radius="md" className="audit-info">
        The app records creates, edits, deletes, and operational decisions so admins can review what changed,
        who did it, when it happened, and which IP was forwarded through the app proxy.
      </Alert>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 5 }} spacing="md">
        {cardData.map((card) => {
          const Icon = card.icon;
          return (
            <Paper key={card.label} className="audit-stat-card" withBorder>
              <Group justify="space-between" align="flex-start" mb="sm">
                <Box className="audit-stat-icon" style={{ color: card.accent }}>
                  <Icon size={18} />
                </Box>
                {card.visual === 'ring' && <Box className="audit-ring"><FileText size={26} /></Box>}
                {card.visual === 'people' && (
                  <Group gap={-4} className="audit-people">
                    {['#2E7D32', '#1565C0', '#E53935', '#546E7A'].map((color) => (
                      <span key={color} style={{ backgroundColor: color }} />
                    ))}
                  </Group>
                )}
                {card.visual === 'shield' && <Box className="audit-check-ring"><CheckCircle2 size={28} /></Box>}
              </Group>

              <Text size="xs" fw={700} tt="uppercase" className="audit-card-label">{card.label}</Text>
              <Title order={3} className="audit-card-value">{card.value}</Title>
              <Text size="xs" className="audit-card-note">{card.note}</Text>

              {card.visual === 'bars' && (
                <Box className="audit-mini-bars">
                  {MINI_BARS.map((height, index) => <span key={index} style={{ height }} />)}
                </Box>
              )}
              {card.visual === 'timeline' && (
                <Box className="audit-timeline">
                  <span />
                  <span />
                  <span className="active" />
                  <span />
                  <span />
                </Box>
              )}
            </Paper>
          );
        })}
      </SimpleGrid>

      <Box className="audit-table-shell">
        <CollectionList
          collection="daas_activity"
          enableSearch
          enableFilter
          enableSort
          fields={['action', 'collection', 'item', 'user_id', 'timestamp', 'ip']}
          limit={50}
          defaultSort={{ by: 'timestamp', desc: true }}
          renderCell={renderCell}
        />
      </Box>
    </Stack>
  );
}
