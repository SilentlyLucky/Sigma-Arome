'use client';

import {
  Stack,
  Title,
  Text,
  Group,
  Button,
  Modal,
  Badge,
  Paper,
  Table,
  ActionIcon,
  Tooltip,
  Loader,
  Alert,
  Menu,
} from '@mantine/core';
import { Input } from '@/components/ui/input';
import { SelectDropdown } from '@/components/ui/select-dropdown';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconUserOff,
  IconUserCheck,
  IconAlertCircle,
  IconDotsVertical,
  IconRefresh,
} from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { useDaaSContext } from '@/lib/buildpad/services/daas-context';

interface DaaSUser {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  status: string;
  roles?: Array<{ id: string; name: string }>;
}

interface Role {
  id: string;
  name: string;
}

interface UserFormValues {
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  role_id: string;
  status: string;
}

const STATUS_COLORS: Record<string, string> = {
  active: 'green',
  invited: 'blue',
  draft: 'gray',
  suspended: 'orange',
  terminated: 'red',
};

export default function UsersPage() {
  const { getHeaders } = useDaaSContext();
  const [users, setUsers] = useState<DaaSUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<DaaSUser | null>(null);
  const [saving, setSaving] = useState(false);
  const [opened, { open, close }] = useDisclosure(false);
  const [formValues, setFormValues] = useState<UserFormValues>({
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    role_id: '',
    status: 'active',
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = await getHeaders();
      // DaaS users have no embedded roles field — roles live in daas_user_roles junction.
      // Fetch users, all roles, and user_role assignments in parallel, then join client-side.
      const [usersRes, rolesRes, userRolesRes] = await Promise.all([
        fetch('/api/users?fields[]=id&fields[]=email&fields[]=first_name&fields[]=last_name&fields[]=status', { headers }),
        fetch('/api/roles', { headers }),
        fetch('/api/items/daas_user_roles?fields[]=user_id&fields[]=role_id&limit=500', { headers }),
      ]);

      const usersData: DaaSUser[] = usersRes.ok ? ((await usersRes.json())?.data ?? []) : [];
      const rolesData: Role[] = rolesRes.ok ? ((await rolesRes.json())?.data ?? []) : [];
      const userRolesData: Array<{ user_id: string; role_id: string }> = userRolesRes.ok
        ? ((await userRolesRes.json())?.data ?? [])
        : [];

      // Build a map: userId → Role[]
      const roleMap = new Map(rolesData.map((r) => [r.id, r]));
      const userRoleMap = new Map<string, Role[]>();
      for (const ur of userRolesData) {
        const role = roleMap.get(ur.role_id);
        if (!role) continue;
        const existing = userRoleMap.get(ur.user_id) ?? [];
        existing.push(role);
        userRoleMap.set(ur.user_id, existing);
      }

      // Attach roles to each user
      const enriched = usersData.map((u) => ({ ...u, roles: userRoleMap.get(u.id) ?? [] }));

      setUsers(enriched);
      setRoles(rolesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setEditingUser(null);
    setFormValues({ email: '', first_name: '', last_name: '', password: '', role_id: '', status: 'active' });
    open();
  };

  const openEdit = (user: DaaSUser) => {
    setEditingUser(user);
    const primaryRole = user.roles?.[0];
    setFormValues({
      email: user.email,
      first_name: user.first_name ?? '',
      last_name: user.last_name ?? '',
      password: '',
      role_id: primaryRole?.id ?? '',
      status: user.status,
    });
    open();
  };

  const handleSave = async () => {
    if (!formValues.email.trim()) {
      notifications.show({ title: 'Validation', message: 'Email is required', color: 'red' });
      return;
    }
    if (!editingUser && !formValues.password.trim()) {
      notifications.show({ title: 'Validation', message: 'Password is required for new users', color: 'red' });
      return;
    }
    setSaving(true);
    try {
      const headers = { 'Content-Type': 'application/json', ...(await getHeaders()) };

      if (editingUser) {
        // Update existing user profile
        const body: Record<string, unknown> = {
          first_name: formValues.first_name || null,
          last_name: formValues.last_name || null,
          status: formValues.status,
        };
        if (formValues.password.trim()) {
          body.password = formValues.password;
        }
        const res = await fetch(`/api/users/${editingUser.id}`, { method: 'PATCH', headers, body: JSON.stringify(body) });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData?.errors?.[0]?.message ?? 'Update failed');
        }
        // Handle role change via daas_user_roles junction
        const currentRoleId = editingUser.roles?.[0]?.id;
        if (formValues.role_id !== (currentRoleId ?? '')) {
          // Remove all existing role assignments for this user first
          const urRes = await fetch(
            `/api/items/daas_user_roles?filter[user_id][_eq]=${editingUser.id}&fields[]=id`,
            { headers }
          );
          if (urRes.ok) {
            const urData = await urRes.json();
            const existingIds: string[] = (urData?.data ?? []).map((r: { id: string }) => r.id);
            for (const urId of existingIds) {
              await fetch(`/api/items/daas_user_roles/${urId}`, { method: 'DELETE', headers });
            }
          }
          // Assign new role if one was selected
          if (formValues.role_id) {
            await fetch('/api/items/daas_user_roles', {
              method: 'POST',
              headers,
              body: JSON.stringify({ user_id: editingUser.id, role_id: formValues.role_id }),
            });
          }
        }
      } else {
        // Create new user
        const body: Record<string, unknown> = {
          email: formValues.email.trim(),
          password: formValues.password,
          first_name: formValues.first_name || null,
          last_name: formValues.last_name || null,
          status: formValues.status,
        };
        const res = await fetch('/api/users', { method: 'POST', headers, body: JSON.stringify(body) });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData?.errors?.[0]?.message ?? 'Create failed');
        }
        // Assign role via daas_user_roles junction if a role was selected
        if (formValues.role_id) {
          const newUser = (await res.json())?.data;
          const userId = newUser?.id;
          if (userId) {
            await fetch('/api/items/daas_user_roles', {
              method: 'POST',
              headers,
              body: JSON.stringify({ user_id: userId, role_id: formValues.role_id }),
            });
          }
        }
      }

      notifications.show({
        title: 'Success',
        message: editingUser ? 'User updated' : 'User created',
        color: 'green',
      });
      close();
      fetchData();
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: err instanceof Error ? err.message : 'Save failed',
        color: 'red',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (user: DaaSUser) => {
    if (!confirm(`Delete user "${user.email}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'DELETE',
        headers: await getHeaders(),
      });
      if (!res.ok && res.status !== 204) {
        const errData = await res.json();
        throw new Error(errData?.errors?.[0]?.message ?? 'Delete failed');
      }
      notifications.show({ title: 'Deleted', message: `User "${user.email}" removed`, color: 'green' });
      fetchData();
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: err instanceof Error ? err.message : 'Delete failed',
        color: 'red',
      });
    }
  };

  const handleStatusChange = async (user: DaaSUser, newStatus: string) => {
    try {
      const headers = { 'Content-Type': 'application/json', ...(await getHeaders()) };
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Status update failed');
      notifications.show({ title: 'Success', message: `User ${newStatus}`, color: 'green' });
      fetchData();
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: err instanceof Error ? err.message : 'Failed to update status',
        color: 'red',
      });
    }
  };

  const roleOptions = roles
    .filter((r) => !['Administrator', 'User'].includes(r.name) || r.name === 'Administrator')
    .map((r) => ({ text: r.name, value: r.id }));

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-start">
        <div>
          <Title order={2}>User Management</Title>
          <Text c="dimmed" size="sm">
            Manage system users and role assignments. Each user is redirected to their role-specific dashboard after login.
          </Text>
        </div>
        <Group gap="xs">
          <Tooltip label="Refresh">
            <ActionIcon variant="subtle" onClick={fetchData} loading={loading}>
              <IconRefresh size={16} />
            </ActionIcon>
          </Tooltip>
          <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>
            New User
          </Button>
        </Group>
      </Group>

      {error && (
        <Alert icon={<IconAlertCircle size={16} />} color="red" title="Error">
          {error}
        </Alert>
      )}

      {loading ? (
        <Group justify="center" py="xl">
          <Loader />
        </Group>
      ) : (
        <Paper withBorder radius="md" style={{ overflowX: 'auto' }}>
          <Table striped highlightOnHover withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Email</Table.Th>
                <Table.Th>Role</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th style={{ width: 60 }}>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {users.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={5}>
                    <Text ta="center" c="dimmed" py="md" size="sm">
                      No users found
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                users.map((user) => (
                  <Table.Tr key={user.id}>
                    <Table.Td>
                      <Text size="sm" fw={500}>
                        {[user.first_name, user.last_name].filter(Boolean).join(' ') || '—'}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{user.email}</Text>
                    </Table.Td>
                    <Table.Td>
                      {user.roles && user.roles.length > 0 ? (
                        <Group gap={4}>
                          {user.roles.map((r) => (
                            <Badge key={r.id} size="xs" variant="light" color="blue">
                              {r.name}
                            </Badge>
                          ))}
                        </Group>
                      ) : (
                        <Text size="xs" c="dimmed">
                          No role
                        </Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        size="xs"
                        variant="light"
                        color={STATUS_COLORS[user.status] ?? 'gray'}
                      >
                        {user.status}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Menu shadow="md" width={160}>
                        <Menu.Target>
                          <ActionIcon variant="subtle" size="sm">
                            <IconDotsVertical size={14} />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item
                            leftSection={<IconEdit size={14} />}
                            onClick={() => openEdit(user)}
                          >
                            Edit
                          </Menu.Item>
                          {user.status === 'active' ? (
                            <Menu.Item
                              leftSection={<IconUserOff size={14} />}
                              color="orange"
                              onClick={() => handleStatusChange(user, 'suspended')}
                            >
                              Suspend
                            </Menu.Item>
                          ) : (
                            <Menu.Item
                              leftSection={<IconUserCheck size={14} />}
                              color="green"
                              onClick={() => handleStatusChange(user, 'active')}
                            >
                              Activate
                            </Menu.Item>
                          )}
                          <Menu.Divider />
                          <Menu.Item
                            leftSection={<IconTrash size={14} />}
                            color="red"
                            onClick={() => handleDelete(user)}
                          >
                            Delete
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </Paper>
      )}

      <Modal
        opened={opened}
        onClose={close}
        title={editingUser ? `Edit User: ${editingUser.email}` : 'Create New User'}
        size="md"
      >
        <Stack gap="md">
          <Input
            label="Email"
            placeholder="user@example.com"
            required={!editingUser}
            disabled={!!editingUser}
            value={formValues.email}
            onChange={(v) => setFormValues((prev) => ({ ...prev, email: String(v ?? '') }))}
          />
          <Group grow>
            <Input
              label="First Name"
              placeholder="First name"
              value={formValues.first_name}
              onChange={(v) => setFormValues((prev) => ({ ...prev, first_name: String(v ?? '') }))}
            />
            <Input
              label="Last Name"
              placeholder="Last name"
              value={formValues.last_name}
              onChange={(v) => setFormValues((prev) => ({ ...prev, last_name: String(v ?? '') }))}
            />
          </Group>
          <Input
            masked
            label={editingUser ? 'New Password (leave blank to keep current)' : 'Password'}
            placeholder="••••••••"
            required={!editingUser}
            value={formValues.password}
            onChange={(v) => setFormValues((prev) => ({ ...prev, password: String(v ?? '') }))}
          />
          <SelectDropdown
            label="Role"
            placeholder="Select a role"
            choices={roleOptions}
            value={formValues.role_id || null}
            onChange={(v) => setFormValues((prev) => ({ ...prev, role_id: String(v ?? '') }))}
            allowNone
          />
          <SelectDropdown
            label="Status"
            choices={[
              { text: 'Active', value: 'active' },
              { text: 'Invited', value: 'invited' },
              { text: 'Suspended', value: 'suspended' },
            ]}
            value={formValues.status}
            onChange={(v) => setFormValues((prev) => ({ ...prev, status: String(v ?? 'active') }))}
          />
          <Group justify="flex-end">
            <Button variant="subtle" onClick={close} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving}>
              {editingUser ? 'Save Changes' : 'Create User'}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
