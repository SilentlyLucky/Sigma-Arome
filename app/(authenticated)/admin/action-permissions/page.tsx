'use client';

import {
  Stack,
  Title,
  Text,
  Paper,
  Group,
  Badge,
  Table,
  Loader,
  Alert,
  Select,
  ActionIcon,
  Tooltip,
  ThemeIcon,
  Code,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconCheck,
  IconX,
  IconAlertCircle,
  IconRefresh,
  IconInfoCircle,
  IconPlus,
  IconTrash,
} from '@tabler/icons-react';
import { useCallback, useEffect, useState } from 'react';
import { useDaaSContext } from '@/lib/buildpad/services/daas-context';

/**
 * Action / Button Permission Configuration
 *
 * Shows which create/update/delete actions each role has per collection.
 * Admin can add or remove action permissions directly from this page.
 * Changes update DaaS policy permissions immediately.
 *
 * Per PRD Section 9.2 — RBUI-004 through RBUI-013.
 */

interface Policy { id: string; name: string; admin_access: boolean }
interface Permission {
  id: number | string;
  policy: string;
  collection: string;
  action: string;
  fields: string[] | null;
}
interface Role { id: string; name: string }
interface AccessEntry { id: string; role: string | null; policy: string }

const COLLECTIONS = [
  'suppliers', 'raw_materials', 'products', 'warehouse_locations',
  'hazard_classes', 'qc_templates', 'iot_sensors', 'inventory',
];
const WRITE_ACTIONS = ['create', 'update', 'delete'] as const;
const OPERATIONAL_ROLES = ['Administrator', 'Manager', 'PPIC', 'Warehouse Operation', 'QC', 'Logistic', 'Production'];

type WriteAction = typeof WRITE_ACTIONS[number];

export default function ActionPermissionsPage() {
  const { getHeaders } = useDaaSContext();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [accessEntries, setAccessEntries] = useState<AccessEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<string>('suppliers');
  const [toggling, setToggling] = useState<string | null>(null); // "roleId-action"

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = await getHeaders();
      const [policiesRes, permsRes, rolesRes, accessRes] = await Promise.all([
        fetch('/api/policies', { headers }),
        fetch('/api/permissions', { headers }),
        fetch('/api/roles', { headers }),
        fetch('/api/access', { headers }),
      ]);
      if (policiesRes.ok) setPolicies((await policiesRes.json())?.data ?? []);
      if (permsRes.ok) setPermissions((await permsRes.json())?.data ?? []);
      if (rolesRes.ok) setRoles((await rolesRes.json())?.data ?? []);
      if (accessRes.ok) setAccessEntries((await accessRes.json())?.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // For a given role, find their non-admin policy
  const getRolePolicy = (roleName: string): Policy | null => {
    const role = roles.find((r) => r.name === roleName);
    if (!role) return null;
    const rolePolicyIds = accessEntries.filter((a) => a.role === role.id).map((a) => a.policy);
    // Return the first non-admin policy
    return policies.find((p) => rolePolicyIds.includes(p.id) && !p.admin_access) ?? null;
  };

  const isAdmin = (roleName: string): boolean => {
    const role = roles.find((r) => r.name === roleName);
    if (!role) return false;
    const rolePolicyIds = accessEntries.filter((a) => a.role === role.id).map((a) => a.policy);
    return policies.some((p) => rolePolicyIds.includes(p.id) && p.admin_access);
  };

  const getPermission = (policyId: string, action: string): Permission | null => {
    return permissions.find((p) => p.policy === policyId && p.collection === selectedCollection && p.action === action) ?? null;
  };

  const togglePermission = async (roleName: string, action: WriteAction) => {
    const policy = getRolePolicy(roleName);
    if (!policy) {
      notifications.show({ title: 'No policy', message: `${roleName} has no non-admin policy to modify`, color: 'orange' });
      return;
    }
    const key = `${roleName}-${action}`;
    setToggling(key);
    try {
      const headers = { 'Content-Type': 'application/json', ...(await getHeaders()) };
      const existing = getPermission(policy.id, action);
      if (existing) {
        // Remove permission
        const res = await fetch(`/api/permissions/${existing.id}`, { method: 'DELETE', headers });
        if (!res.ok && res.status !== 204) throw new Error('Delete failed');
        notifications.show({ title: 'Removed', message: `${roleName}: ${action} on ${selectedCollection} removed`, color: 'orange' });
      } else {
        // Add permission
        const res = await fetch('/api/permissions', {
          method: 'POST',
          headers,
          body: JSON.stringify({ policy: policy.id, collection: selectedCollection, action, fields: ['*'] }),
        });
        if (!res.ok) throw new Error((await res.json())?.errors?.[0]?.message ?? 'Add failed');
        notifications.show({ title: 'Added', message: `${roleName}: ${action} on ${selectedCollection} granted`, color: 'green' });
      }
      fetchAll();
    } catch (err) {
      notifications.show({ title: 'Error', message: err instanceof Error ? err.message : 'Toggle failed', color: 'red' });
    } finally {
      setToggling(null);
    }
  };

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-start">
        <div>
          <Title order={2}>Action Permission Configuration</Title>
          <Text c="dimmed" size="sm">
            Configure which create / update / delete actions each role can perform per collection. Click a cell to toggle.
          </Text>
        </div>
        <Tooltip label="Refresh">
          <ActionIcon variant="subtle" onClick={fetchAll} loading={loading}>
            <IconRefresh size={16} />
          </ActionIcon>
        </Tooltip>
      </Group>

      <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
        <strong>Administrator</strong> is always allowed to make changes. For other roles, click a cell
        to allow or block creating, editing, or deleting records in the selected area.
      </Alert>

      {error && <Alert icon={<IconAlertCircle size={16} />} color="red" title="Error">{error}</Alert>}

      <Select
        label="Collection"
        data={COLLECTIONS.map((c) => ({ value: c, label: c.replace(/_/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase()) }))}
        value={selectedCollection}
        onChange={(v) => setSelectedCollection(v ?? COLLECTIONS[0])}
        style={{ maxWidth: 300 }}
      />

      {loading ? (
        <Group justify="center" py="xl"><Loader /></Group>
      ) : (
        <Paper withBorder radius="md" style={{ overflowX: 'auto' }}>
          <Table striped highlightOnHover withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th style={{ minWidth: 180 }}>Role</Table.Th>
                <Table.Th style={{ minWidth: 100 }}>Policy</Table.Th>
                {WRITE_ACTIONS.map((action) => (
                  <Table.Th key={action} style={{ minWidth: 100, textAlign: 'center' }}>
                    <Badge size="xs" variant="light" color={action === 'create' ? 'blue' : action === 'update' ? 'orange' : 'red'}>
                      {action}
                    </Badge>
                  </Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {OPERATIONAL_ROLES.map((roleName) => {
                const admin = isAdmin(roleName);
                const policy = getRolePolicy(roleName);
                const key = `${roleName}`;
                return (
                  <Table.Tr key={key}>
                    <Table.Td>
                      <Text size="sm" fw={500}>{roleName}</Text>
                    </Table.Td>
                    <Table.Td>
                      {admin ? (
                        <Badge size="xs" color="red" variant="light">Admin</Badge>
                      ) : policy ? (
                        <Code fz="xs">{policy.name}</Code>
                      ) : (
                        <Text size="xs" c="dimmed">No policy</Text>
                      )}
                    </Table.Td>
                    {WRITE_ACTIONS.map((action) => {
                      const toggleKey = `${roleName}-${action}`;
                      const isToggling = toggling === toggleKey;
                      if (admin) {
                        return (
                          <Table.Td key={action} style={{ textAlign: 'center' }}>
                            <ThemeIcon size="sm" variant="light" color="red" style={{ margin: 'auto' }}>
                              <IconCheck size={12} />
                            </ThemeIcon>
                          </Table.Td>
                        );
                      }
                      if (!policy) {
                        return (
                          <Table.Td key={action} style={{ textAlign: 'center' }}>
                            <ThemeIcon size="sm" variant="light" color="gray" style={{ margin: 'auto' }}>
                              <IconX size={12} />
                            </ThemeIcon>
                          </Table.Td>
                        );
                      }
                      const perm = getPermission(policy.id, action);
                      const allowed = !!perm;
                      return (
                        <Table.Td key={action} style={{ textAlign: 'center' }}>
                          <Tooltip label={allowed ? `Remove ${action} permission` : `Grant ${action} permission`}>
                            <ActionIcon
                              size="sm"
                              variant="light"
                              color={allowed ? (action === 'create' ? 'blue' : action === 'update' ? 'orange' : 'red') : 'gray'}
                              style={{ margin: 'auto' }}
                              loading={isToggling}
                              onClick={() => togglePermission(roleName, action)}
                            >
                              {allowed ? <IconCheck size={12} /> : <IconX size={12} />}
                            </ActionIcon>
                          </Tooltip>
                        </Table.Td>
                      );
                    })}
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </Paper>
      )}

      <Paper p="md" radius="md" withBorder>
        <Group gap="xs" mb="xs">
          <Text fw={600} size="sm">Legend</Text>
        </Group>
        <Group gap="md">
          <Group gap={4}>
            <ThemeIcon size="xs" color="blue" variant="light"><IconCheck size={10} /></ThemeIcon>
            <Text size="xs">Allowed — click to revoke</Text>
          </Group>
          <Group gap={4}>
            <ThemeIcon size="xs" color="gray" variant="light"><IconX size={10} /></ThemeIcon>
            <Text size="xs">Blocked — click to grant</Text>
          </Group>
          <Group gap={4}>
            <ThemeIcon size="xs" color="red" variant="light"><IconCheck size={10} /></ThemeIcon>
            <Text size="xs">Admin bypass — always allowed</Text>
          </Group>
        </Group>
      </Paper>
    </Stack>
  );
}
