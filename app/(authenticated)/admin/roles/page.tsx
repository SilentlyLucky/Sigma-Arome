'use client';

import {
  Stack,
  Title,
  Text,
  Paper,
  Group,
  Badge,
  ThemeIcon,
  SimpleGrid,
  Button,
  Modal,
  ActionIcon,
  Tooltip,
  Loader,
  Alert,
} from '@mantine/core';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconShieldCheck,
  IconEdit,
  IconTrash,
  IconUsers,
  IconAlertCircle,
  IconPlus,
} from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { useDaaSContext } from '@/lib/buildpad/services/daas-context';

interface Role {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
}

interface RoleFormValues {
  name: string;
  description: string;
  icon: string;
}

const SYSTEM_ROLES = ['Administrator', 'User'];

export default function RolesPage() {
  const { getHeaders } = useDaaSContext();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formValues, setFormValues] = useState<RoleFormValues>({ name: '', description: '', icon: '' });
  const [saving, setSaving] = useState(false);
  const [opened, { open, close }] = useDisclosure(false);

  const fetchRoles = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/roles');
      const data = await res.json();
      if (!res.ok) {
        const msg = data?.errors?.[0]?.message ?? `HTTP ${res.status}`;
        throw new Error(msg);
      }
      setRoles(data?.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openEdit = (role: Role) => {
    setEditingRole(role);
    setFormValues({
      name: role.name,
      description: role.description ?? '',
      icon: role.icon ?? '',
    });
    open();
  };

  const openCreate = () => {
    setEditingRole(null);
    setFormValues({ name: '', description: '', icon: 'person' });
    open();
  };

  const handleSave = async () => {
    if (!formValues.name.trim()) {
      notifications.show({ title: 'Validation', message: 'Role name is required', color: 'red' });
      return;
    }
    setSaving(true);
    try {
      const url = editingRole ? `/api/roles/${editingRole.id}` : '/api/roles';
      const method = editingRole ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...(await getHeaders()) },
        body: JSON.stringify({
          name: formValues.name.trim(),
          description: formValues.description.trim() || null,
          icon: formValues.icon.trim() || 'person',
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData?.errors?.[0]?.message ?? 'Save failed');
      }
      notifications.show({
        title: 'Success',
        message: editingRole ? 'Role updated' : 'Role created',
        color: 'green',
      });
      close();
      fetchRoles();
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

  const isSystemRole = (role: Role) => SYSTEM_ROLES.includes(role.name);

  const handleDelete = async (role: Role) => {
    if (!confirm(`Delete role "${role.name}"? This cannot be undone. Users assigned this role will lose it.`)) return;
    try {
      const res = await fetch(`/api/roles/${role.id}`, {
        method: 'DELETE',
        headers: await getHeaders(),
      });
      if (!res.ok && res.status !== 204) {
        const errData = await res.json();
        throw new Error(errData?.errors?.[0]?.message ?? 'Delete failed');
      }
      notifications.show({ title: 'Deleted', message: `Role "${role.name}" removed`, color: 'green' });
      fetchRoles();
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: err instanceof Error ? err.message : 'Delete failed',
        color: 'red',
      });
    }
  };

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-start">
        <div>
          <Title order={2}>Role Management</Title>
          <Text c="dimmed" size="sm">
            View and manage system roles. Roles control which dashboard and modules each user can access.
          </Text>
        </div>
        <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>
          New Role
        </Button>
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
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
          {roles.map((role) => (
            <Paper key={role.id} p="md" radius="md" withBorder>
              <Group justify="space-between" mb="xs">
                <Group gap="xs">
                  <ThemeIcon size="md" radius="md" variant="light" color="blue">
                    <IconShieldCheck size={16} />
                  </ThemeIcon>
                  <Text fw={600} size="sm">
                    {role.name}
                  </Text>
                </Group>
                <Group gap={4}>
                  {isSystemRole(role) && (
                    <Badge size="xs" variant="light" color="gray">
                      System
                    </Badge>
                  )}
                  <Tooltip label="Edit role">
                    <ActionIcon
                      variant="subtle"
                      size="sm"
                      onClick={() => openEdit(role)}
                      disabled={isSystemRole(role)}
                    >
                      <IconEdit size={14} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label={isSystemRole(role) ? 'System roles cannot be deleted' : 'Delete role'}>
                    <ActionIcon
                      variant="subtle"
                      size="sm"
                      color="red"
                      onClick={() => handleDelete(role)}
                      disabled={isSystemRole(role)}
                    >
                      <IconTrash size={14} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              </Group>
              <Text size="xs" c="dimmed" lineClamp={2}>
                {role.description ?? 'No description'}
              </Text>
            </Paper>
          ))}
        </SimpleGrid>
      )}

      <Paper p="md" radius="md" withBorder>
        <Group gap="xs" mb="xs">
          <IconUsers size={16} />
          <Text fw={600} size="sm">
            Role Assignment
          </Text>
        </Group>
        <Text size="xs" c="dimmed">
          To assign roles to users, go to{' '}
          <Text component="a" href="/admin/users" size="xs" c="blue">
            User Management
          </Text>{' '}
          and edit the user&apos;s role assignment. Roles determine which dashboard and modules each user sees after login.
        </Text>
      </Paper>

      <Modal
        opened={opened}
        onClose={close}
        title={editingRole ? `Edit Role: ${editingRole.name}` : 'Create New Role'}
        size="md"
      >
        <Stack gap="md">
          <Input
            label="Role Name"
            placeholder="e.g. QC Supervisor"
            required
            value={formValues.name}
            onChange={(v) => setFormValues((prev) => ({ ...prev, name: String(v ?? '') }))}
          />
          <Input
            label="Icon"
            placeholder="Material icon name, e.g. science"
            value={formValues.icon}
            onChange={(v) => setFormValues((prev) => ({ ...prev, icon: String(v ?? '') }))}
          />
          <Textarea
            label="Description"
            placeholder="Describe what this role can do"
            value={formValues.description}
            onChange={(v) => setFormValues((prev) => ({ ...prev, description: String(v ?? '') }))}
          />
          <Group justify="flex-end">
            <Button variant="subtle" onClick={close} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving}>
              {editingRole ? 'Save Changes' : 'Create Role'}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
