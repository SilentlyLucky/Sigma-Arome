'use client';

import { Stack, Title, Text, Alert, Group, Badge } from '@mantine/core';
import { CollectionList } from '@/components/ui/collection-list';
import { IconInfoCircle, IconLock } from '@tabler/icons-react';
import { useEffect, useState } from 'react';

/**
 * Admin Audit Log Page
 *
 * Uses DaaS built-in daas_activity collection — automatic audit trail.
 * - Default sort: timestamp descending (newest first)
 * - User column shows "ROLE (First Last)" instead of raw UUID
 * - Read-only for all users (AUDIT-003)
 */

interface UserInfo {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  roleName: string | null;
}

// Role ID → role name map (populated from DaaS)
const ROLE_ROUTE_MAP: Record<string, string> = {
  '00000000-0000-0000-0000-000000000001': 'Admin',
};

export default function AuditLogPage() {
  // Cache of userId → display string "ROLE (Name)"
  const [userLabels, setUserLabels] = useState<Record<string, string>>({});

  // Pre-load all users + their roles once
  useEffect(() => {
    const load = async () => {
      try {
        // Fetch users with basic info
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

        // Fetch user-role assignments
        const rolesRes = await fetch('/api/items/daas_user_roles?fields[]=user_id&fields[]=role_id&limit=500');
        const rolesData = rolesRes.ok ? await rolesRes.json() : { data: [] };
        const userRoleMap: Record<string, string[]> = {};
        for (const row of (rolesData?.data ?? [])) {
          const uid = String(row.user_id ?? '');
          if (!userRoleMap[uid]) userRoleMap[uid] = [];
          userRoleMap[uid].push(String(row.role_id ?? ''));
        }

        // Fetch role names
        const roleNamesRes = await fetch('/api/roles?fields[]=id&fields[]=name&limit=50');
        const roleNamesData = roleNamesRes.ok ? await roleNamesRes.json() : { data: [] };
        const roleNameMap: Record<string, string> = { ...ROLE_ROUTE_MAP };
        for (const r of (roleNamesData?.data ?? [])) {
          roleNameMap[String(r.id ?? '')] = String(r.name ?? '');
        }

        // Also fetch app_user_access for role_key labels
        const accessRes = await fetch('/api/items/app_user_access?fields[]=user_id&fields[]=role_key&limit=200');
        const accessData = accessRes.ok ? await accessRes.json() : { data: [] };
        const accessMap: Record<string, string> = {};
        for (const row of (accessData?.data ?? [])) {
          accessMap[String(row.user_id ?? '')] = String(row.role_key ?? '');
        }

        // Build display labels
        const labels: Record<string, string> = {};
        for (const user of users) {
          const name = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.email || user.id.slice(0, 8);
          // Try app_user_access role_key first (most readable)
          const roleKey = accessMap[user.id];
          let roleName = '';
          if (roleKey) {
            // Capitalise role_key: "warehouse_operation" → "Warehouse Operation"
            roleName = roleKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          } else {
            // Fall back to role name from daas_roles
            const roleIds = userRoleMap[user.id] ?? [];
            const firstRoleName = roleIds.map(rid => roleNameMap[rid]).filter(Boolean)[0];
            roleName = firstRoleName ?? '';
          }
          labels[user.id] = roleName ? `${roleName} (${name})` : name;
        }
        setUserLabels(labels);
      } catch {
        // Non-fatal — fall back to UUID display
      }
    };
    load();
  }, []);

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-start">
        <div>
          <Title order={2}>Audit Log</Title>
          <Text c="dimmed" size="sm">
            System activity log — all critical actions are recorded automatically.
            This log is read-only and cannot be modified or deleted.
          </Text>
        </div>
        <Badge leftSection={<IconLock size={12} />} variant="light" color="gray">
          Read-Only
        </Badge>
      </Group>

      <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
        The app records creates, edits, and deletes so admins can review what changed, who did it,
        and when it happened. This includes admin changes, PPIC orders, QC decisions, warehouse
        operations, and production events.
      </Alert>

      <CollectionList
        collection="daas_activity"
        enableSearch
        enableFilter
        enableSort
        fields={['action', 'collection', 'item', 'user_id', 'timestamp', 'ip']}
        limit={50}
        defaultSort={{ by: 'timestamp', desc: true }}
        renderCell={(item, header) => {
          if (header.value === 'user_id') {
            const uid = String(item.user_id ?? '');
            const label = userLabels[uid];
            if (label) {
              return (
                <Text size="sm" style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                  {label}
                </Text>
              );
            }
            // Still loading — show shortened UUID
            return (
              <Text size="sm" c="dimmed" style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                {uid.slice(0, 8)}…
              </Text>
            );
          }
          return null;
        }}
      />
    </Stack>
  );
}
