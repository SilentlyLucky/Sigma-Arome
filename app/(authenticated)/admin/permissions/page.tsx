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
  Tabs,
  ThemeIcon,
  Button,
  Modal,
  ActionIcon,
  Tooltip,
  Select,
  MultiSelect,
  Divider,
  Code,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconShieldCheck,
  IconAlertCircle,
  IconLock,
  IconLockOpen,
  IconPlus,
  IconTrash,
  IconEdit,
  IconRefresh,
  IconInfoCircle,
} from '@tabler/icons-react';
import { useEffect, useState, useCallback } from 'react';
import { useDaaSContext } from '@/lib/buildpad/services/daas-context';
import { Input } from '@/components/ui/input';
import { SelectDropdown } from '@/components/ui/select-dropdown';

interface Role { id: string; name: string; description: string | null }
interface Policy { id: string; name: string; description: string | null; admin_access: boolean; app_access: boolean }
interface AccessEntry { id: string; role: string | null; user: string | null; policy: string }
interface Permission {
  id: number | string;
  policy: string;
  collection: string;
  action: string;
  fields: string[] | null;
  permissions: Record<string, unknown> | null;
}

const COLLECTIONS = [
  'suppliers', 'raw_materials', 'products', 'warehouse_locations',
  'hazard_classes', 'qc_templates', 'iot_sensors', 'inventory',
];
const ACTIONS = ['create', 'read', 'update', 'delete'];
const OPERATIONAL_ROLES = ['Administrator', 'Manager', 'PPIC', 'Warehouse Operation', 'QC', 'Logistic', 'Production'];

export default function PermissionsPage() {
  const { getHeaders } = useDaaSContext();
  const [roles, setRoles] = useState<Role[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [accessEntries, setAccessEntries] = useState<AccessEntry[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Policy modal
  const [policyModal, { open: openPolicyModal, close: closePolicyModal }] = useDisclosure(false);
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
  const [policyForm, setPolicyForm] = useState({ name: '', description: '', app_access: true });
  const [savingPolicy, setSavingPolicy] = useState(false);

  // Permission modal
  const [permModal, { open: openPermModal, close: closePermModal }] = useDisclosure(false);
  const [permForm, setPermForm] = useState({ policy: '', collection: '', action: 'read', fields: ['*'] });
  const [savingPerm, setSavingPerm] = useState(false);

  // Access assignment modal
  const [accessModal, { open: openAccessModal, close: closeAccessModal }] = useDisclosure(false);
  const [accessForm, setAccessForm] = useState({ policy: '', role: '' });
  const [editingAccessEntry, setEditingAccessEntry] = useState<{ entryId: string; roleId: string; roleName: string } | null>(null);
  const [savingAccess, setSavingAccess] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = await getHeaders();
      const [rolesRes, policiesRes, accessRes, permsRes] = await Promise.all([
        fetch('/api/roles', { headers }),
        fetch('/api/policies', { headers }),
        fetch('/api/access', { headers }),
        fetch('/api/permissions', { headers }),
      ]);
      if (rolesRes.ok) setRoles((await rolesRes.json())?.data ?? []);
      if (policiesRes.ok) setPolicies((await policiesRes.json())?.data ?? []);
      if (accessRes.ok) setAccessEntries((await accessRes.json())?.data ?? []);
      if (permsRes.ok) setPermissions((await permsRes.json())?.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Policy CRUD ──────────────────────────────────────────────────────────────
  const openCreatePolicy = () => {
    setEditingPolicy(null);
    setPolicyForm({ name: '', description: '', app_access: true });
    openPolicyModal();
  };
  const openEditPolicy = (p: Policy) => {
    setEditingPolicy(p);
    setPolicyForm({ name: p.name, description: p.description ?? '', app_access: p.app_access });
    openPolicyModal();
  };
  const savePolicy = async () => {
    if (!policyForm.name.trim()) {
      notifications.show({ title: 'Validation', message: 'Policy name is required', color: 'red' });
      return;
    }
    setSavingPolicy(true);
    try {
      const headers = { 'Content-Type': 'application/json', ...(await getHeaders()) };
      const body = { name: policyForm.name.trim(), description: policyForm.description || null, app_access: policyForm.app_access, admin_access: false };
      const url = editingPolicy ? `/api/policies/${editingPolicy.id}` : '/api/policies';
      const method = editingPolicy ? 'PATCH' : 'POST';
      const res = await fetch(url, { method, headers, body: JSON.stringify(body) });
      if (!res.ok) throw new Error((await res.json())?.errors?.[0]?.message ?? 'Save failed');
      notifications.show({ title: 'Success', message: editingPolicy ? 'Policy updated' : 'Policy created', color: 'green' });
      closePolicyModal();
      fetchAll();
    } catch (err) {
      notifications.show({ title: 'Error', message: err instanceof Error ? err.message : 'Save failed', color: 'red' });
    } finally {
      setSavingPolicy(false);
    }
  };
  const deletePolicy = async (id: string) => {
    if (!confirm('Delete this policy? This will also remove all its permissions and role assignments.')) return;
    try {
      const headers = await getHeaders();
      const res = await fetch(`/api/policies/${id}`, { method: 'DELETE', headers });
      if (!res.ok && res.status !== 204) throw new Error('Delete failed');
      notifications.show({ title: 'Deleted', message: 'Policy removed', color: 'green' });
      fetchAll();
    } catch (err) {
      notifications.show({ title: 'Error', message: err instanceof Error ? err.message : 'Delete failed', color: 'red' });
    }
  };

  // ── Permission CRUD ──────────────────────────────────────────────────────────
  const openAddPerm = (policyId?: string) => {
    setPermForm({ policy: policyId ?? '', collection: COLLECTIONS[0], action: 'read', fields: [] });
    openPermModal();
  };
  const savePerm = async () => {
    if (!permForm.policy || !permForm.collection) {
      notifications.show({ title: 'Validation', message: 'Policy and collection are required', color: 'red' });
      return;
    }
    setSavingPerm(true);
    try {
      const headers = { 'Content-Type': 'application/json', ...(await getHeaders()) };
      const body = { policy: permForm.policy, collection: permForm.collection, action: permForm.action, fields: permForm.fields.length ? permForm.fields : null };
      const res = await fetch('/api/permissions', { method: 'POST', headers, body: JSON.stringify(body) });
      if (!res.ok) throw new Error((await res.json())?.errors?.[0]?.message ?? 'Save failed');
      notifications.show({ title: 'Success', message: 'Permission added', color: 'green' });
      closePermModal();
      fetchAll();
    } catch (err) {
      notifications.show({ title: 'Error', message: err instanceof Error ? err.message : 'Save failed', color: 'red' });
    } finally {
      setSavingPerm(false);
    }
  };
  const deletePerm = async (id: number | string) => {
    try {
      const headers = await getHeaders();
      const res = await fetch(`/api/permissions/${id}`, { method: 'DELETE', headers });
      if (!res.ok && res.status !== 204) throw new Error('Delete failed');
      notifications.show({ title: 'Deleted', message: 'Permission removed', color: 'green' });
      fetchAll();
    } catch (err) {
      notifications.show({ title: 'Error', message: err instanceof Error ? err.message : 'Delete failed', color: 'red' });
    }
  };

  // ── Access Assignment ────────────────────────────────────────────────────────
  const openAssignAccess = () => {
    setEditingAccessEntry(null);
    setAccessForm({ policy: '', role: '' });
    openAccessModal();
  };
  const openEditAccess = (entryId: string, roleId: string, roleName: string, currentPolicyId: string) => {
    setEditingAccessEntry({ entryId, roleId, roleName });
    setAccessForm({ policy: currentPolicyId, role: roleId });
    openAccessModal();
  };
  const saveAccess = async () => {
    if (!accessForm.policy || !accessForm.role) {
      notifications.show({ title: 'Validation', message: 'Policy and role are required', color: 'red' });
      return;
    }
    setSavingAccess(true);
    try {
      const headers = { 'Content-Type': 'application/json', ...(await getHeaders()) };
      if (editingAccessEntry) {
        // Replace: delete old entry, create new one
        await fetch(`/api/access/${editingAccessEntry.entryId}`, { method: 'DELETE', headers });
      }
      const res = await fetch('/api/access', { method: 'POST', headers, body: JSON.stringify({ policy: accessForm.policy, role: accessForm.role }) });
      if (!res.ok) throw new Error((await res.json())?.errors?.[0]?.message ?? 'Save failed');
      notifications.show({ title: 'Success', message: editingAccessEntry ? 'Assignment updated' : 'Policy assigned to role', color: 'green' });
      closeAccessModal();
      fetchAll();
    } catch (err) {
      notifications.show({ title: 'Error', message: err instanceof Error ? err.message : 'Save failed', color: 'red' });
    } finally {
      setSavingAccess(false);
    }
  };
  const deleteAccess = async (id: string) => {
    try {
      const headers = await getHeaders();
      const res = await fetch(`/api/access/${id}`, { method: 'DELETE', headers });
      if (!res.ok && res.status !== 204) throw new Error('Delete failed');
      notifications.show({ title: 'Deleted', message: 'Assignment removed', color: 'green' });
      fetchAll();
    } catch (err) {
      notifications.show({ title: 'Error', message: err instanceof Error ? err.message : 'Delete failed', color: 'red' });
    }
  };

  const getRolePolicies = (roleId: string) => {
    const policyIds = accessEntries.filter((a) => a.role === roleId).map((a) => a.policy);
    return policies.filter((p) => policyIds.includes(p.id));
  };
  const getPolicyPermissions = (policyId: string) => permissions.filter((p) => p.policy === policyId);
  const getPolicyRoles = (policyId: string) => {
    const roleIds = accessEntries.filter((a) => a.policy === policyId).map((a) => a.role);
    return roles.filter((r) => roleIds.includes(r.id));
  };

  const policyChoices = policies.filter((p) => !p.admin_access).map((p) => ({ text: p.name, value: p.id }));
  const roleChoices = roles.filter((r) => OPERATIONAL_ROLES.includes(r.name)).map((r) => ({ text: r.name, value: r.id }));
  const collectionChoices = COLLECTIONS.map((c) => ({ value: c, label: c }));
  const actionChoices = ACTIONS.map((a) => ({ value: a, label: a }));

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-start">
        <div>
          <Title order={2}>Permission Configuration</Title>
          <Text c="dimmed" size="sm">
            Manage DaaS policies, collection permissions, and role assignments. Changes take effect immediately at the backend.
          </Text>
        </div>
        <Tooltip label="Refresh">
          <ActionIcon variant="subtle" onClick={fetchAll} loading={loading}>
            <IconRefresh size={16} />
          </ActionIcon>
        </Tooltip>
      </Group>

      {error && <Alert icon={<IconAlertCircle size={16} />} color="red" title="Error">{error}</Alert>}

      <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
        Permissions are enforced server-side by DaaS. The <strong>Administrator</strong> role has admin_access=true and bypasses all permission checks. Other roles use policies with explicit collection-level permissions.
      </Alert>

      <Tabs defaultValue="roles">
        <Tabs.List>
          <Tabs.Tab value="roles" leftSection={<IconShieldCheck size={14} />}>Role Assignments</Tabs.Tab>
          <Tabs.Tab value="policies" leftSection={<IconLock size={14} />}>Policies & Permissions</Tabs.Tab>
        </Tabs.List>

        {/* ── Role → Policy view ── */}
        <Tabs.Panel value="roles" pt="md">
          <Stack gap="sm">
            <Group justify="flex-end">
              <Button size="xs" leftSection={<IconPlus size={14} />} variant="light" onClick={openAssignAccess}>
                Assign Policy to Role
              </Button>
            </Group>
            {loading ? <Group justify="center" py="xl"><Loader /></Group> : (
              roles.filter((r) => OPERATIONAL_ROLES.includes(r.name)).map((role) => {
                const rPolicies = getRolePolicies(role.id);
                const rAccess = accessEntries.filter((a) => a.role === role.id);
                return (
                  <Paper key={role.id} p="md" radius="md" withBorder>
                    <Group justify="space-between" mb="xs">
                      <Group gap="xs">
                        <ThemeIcon size="sm" variant="light" color="blue"><IconShieldCheck size={12} /></ThemeIcon>
                        <Text fw={600} size="sm">{role.name}</Text>
                      </Group>
                      <Group gap={4}>
                        <Badge size="xs" variant="outline">{rPolicies.length} {rPolicies.length === 1 ? 'policy' : 'policies'}</Badge>
                        <Tooltip label="Assign another policy to this role">
                          <ActionIcon
                            size="xs"
                            variant="subtle"
                            onClick={() => {
                              setEditingAccessEntry(null);
                              setAccessForm({ policy: '', role: role.id });
                              openAccessModal();
                            }}
                          >
                            <IconPlus size={12} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Group>
                    {rPolicies.length === 0 ? (
                      <Text size="xs" c="dimmed">No policies assigned — click + to assign one.</Text>
                    ) : (
                      <Stack gap={6}>
                        {rPolicies.map((p) => {
                          const entry = rAccess.find((a) => a.policy === p.id);
                          return (
                            <Paper key={p.id} p="xs" radius="sm" withBorder bg="var(--mantine-color-default-hover)">
                              <Group justify="space-between">
                                <Group gap="xs">
                                  <Badge size="xs" variant="light" color={p.admin_access ? 'red' : 'blue'}>{p.name}</Badge>
                                  {p.admin_access && <Badge size="xs" color="red" variant="dot">admin bypass</Badge>}
                                  {p.app_access && !p.admin_access && <Badge size="xs" color="green" variant="dot">app access</Badge>}
                                </Group>
                                {entry && !p.admin_access && (
                                  <Group gap={4}>
                                    <Tooltip label="Change policy for this role">
                                      <ActionIcon
                                        size="xs"
                                        variant="subtle"
                                        onClick={() => openEditAccess(entry.id, role.id, role.name, p.id)}
                                      >
                                        <IconEdit size={12} />
                                      </ActionIcon>
                                    </Tooltip>
                                    <Tooltip label="Remove this policy from role">
                                      <ActionIcon size="xs" color="red" variant="subtle" onClick={() => deleteAccess(entry.id)}>
                                        <IconTrash size={12} />
                                      </ActionIcon>
                                    </Tooltip>
                                  </Group>
                                )}
                              </Group>
                              {p.description && (
                                <Text size="xs" c="dimmed" mt={4}>{p.description}</Text>
                              )}
                            </Paper>
                          );
                        })}
                      </Stack>
                    )}
                  </Paper>
                );
              })
            )}
          </Stack>
        </Tabs.Panel>

        {/* ── Policies & Permissions view ── */}
        <Tabs.Panel value="policies" pt="md">
          <Stack gap="sm">
            <Group justify="flex-end" gap="xs">
              <Button size="xs" leftSection={<IconPlus size={14} />} variant="light" onClick={() => openAddPerm()}>
                Add Permission
              </Button>
              <Button size="xs" leftSection={<IconPlus size={14} />} onClick={openCreatePolicy}>
                New Policy
              </Button>
            </Group>

            {loading ? <Group justify="center" py="xl"><Loader /></Group> : (
              policies.map((policy) => {
                const perms = getPolicyPermissions(policy.id);
                const assignedRoles = getPolicyRoles(policy.id);
                return (
                  <Paper key={policy.id} p="md" radius="md" withBorder>
                    <Group justify="space-between" mb="xs">
                      <Group gap="xs">
                        <ThemeIcon size="sm" variant="light" color={policy.admin_access ? 'red' : 'blue'}>
                          {policy.admin_access ? <IconLock size={12} /> : <IconLockOpen size={12} />}
                        </ThemeIcon>
                        <Text fw={600} size="sm">{policy.name}</Text>
                        {policy.admin_access && <Badge size="xs" color="red" variant="light">Admin Access</Badge>}
                        {policy.app_access && <Badge size="xs" color="green" variant="light">App Access</Badge>}
                      </Group>
                      <Group gap={4}>
                        {!policy.admin_access && (
                          <>
                            <Tooltip label="Add permission to this policy">
                              <ActionIcon size="sm" variant="light" color="blue" onClick={() => openAddPerm(policy.id)}>
                                <IconPlus size={14} />
                              </ActionIcon>
                            </Tooltip>
                            <Tooltip label="Edit policy name / description">
                              <ActionIcon size="sm" variant="light" onClick={() => openEditPolicy(policy)}>
                                <IconEdit size={14} />
                              </ActionIcon>
                            </Tooltip>
                            <Tooltip label="Delete policy">
                              <ActionIcon size="sm" color="red" variant="light" onClick={() => deletePolicy(policy.id)}>
                                <IconTrash size={14} />
                              </ActionIcon>
                            </Tooltip>
                          </>
                        )}
                      </Group>
                    </Group>

                    {policy.description && <Text size="xs" c="dimmed" mb="xs">{policy.description}</Text>}

                    {/* Assigned roles */}
                    {assignedRoles.length > 0 && (
                      <Group gap={4} mb="xs">
                        <Text size="xs" c="dimmed">Roles:</Text>
                        {assignedRoles.map((r) => <Badge key={r.id} size="xs" variant="outline">{r.name}</Badge>)}
                      </Group>
                    )}

                    <Divider my="xs" />

                    {/* Permissions table */}
                    {policy.admin_access ? (
                      <Text size="xs" c="dimmed">Admin policy — bypasses all collection-level permission checks.</Text>
                    ) : perms.length === 0 ? (
                      <Text size="xs" c="dimmed">No permissions defined yet.</Text>
                    ) : (
                      <Table withTableBorder withColumnBorders fz="xs">
                        <Table.Thead>
                          <Table.Tr>
                            <Table.Th>Collection</Table.Th>
                            <Table.Th>Action</Table.Th>
                            <Table.Th>Fields</Table.Th>
                            <Table.Th style={{ width: 40 }}></Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {perms.map((perm) => (
                            <Table.Tr key={perm.id}>
                              <Table.Td><Code fz="xs">{perm.collection}</Code></Table.Td>
                              <Table.Td>
                                <Badge size="xs" variant="light" color={
                                  perm.action === 'read' ? 'green' :
                                  perm.action === 'create' ? 'blue' :
                                  perm.action === 'update' ? 'orange' : 'red'
                                }>{perm.action}</Badge>
                              </Table.Td>
                              <Table.Td>
                                <Text size="xs" c="dimmed">
                                  {perm.fields?.includes('*') ? 'All fields' : (perm.fields ?? []).join(', ') || 'All fields'}
                                </Text>
                              </Table.Td>
                              <Table.Td>
                                <Tooltip label="Remove permission">
                                  <ActionIcon size="xs" color="red" variant="subtle" onClick={() => deletePerm(perm.id)}>
                                    <IconTrash size={10} />
                                  </ActionIcon>
                                </Tooltip>
                              </Table.Td>
                            </Table.Tr>
                          ))}
                        </Table.Tbody>
                      </Table>
                    )}
                  </Paper>
                );
              })
            )}
          </Stack>
        </Tabs.Panel>
      </Tabs>

      {/* Policy Modal */}
      <Modal opened={policyModal} onClose={closePolicyModal} title={editingPolicy ? 'Edit Policy' : 'New Policy'} size="sm">
        <Stack gap="md">
          <Input label="Policy Name" placeholder="e.g. PPIC Read Policy" required value={policyForm.name} onChange={(v) => setPolicyForm((p) => ({ ...p, name: String(v ?? '') }))} />
          <Input label="Description" placeholder="What this policy grants" value={policyForm.description} onChange={(v) => setPolicyForm((p) => ({ ...p, description: String(v ?? '') }))} />
          <Group justify="flex-end">
            <Button variant="subtle" onClick={closePolicyModal} disabled={savingPolicy}>Cancel</Button>
            <Button onClick={savePolicy} loading={savingPolicy}>{editingPolicy ? 'Save' : 'Create'}</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Permission Modal */}
      <Modal opened={permModal} onClose={closePermModal} title="Add Permission" size="sm">
        <Stack gap="md">
          <SelectDropdown
            label="Policy"
            placeholder="Select policy"
            choices={policyChoices}
            value={permForm.policy || null}
            onChange={(v) => setPermForm((p) => ({ ...p, policy: String(v ?? '') }))}
          />
          <Select
            label="Collection"
            data={collectionChoices}
            value={permForm.collection}
            onChange={(v) => setPermForm((p) => ({ ...p, collection: v ?? COLLECTIONS[0] }))}
          />
          <Select
            label="Action"
            data={actionChoices}
            value={permForm.action}
            onChange={(v) => setPermForm((p) => ({ ...p, action: v ?? 'read' }))}
          />
          <MultiSelect
            label="Fields"
            description='Select "All fields" for full access, or pick specific fields to restrict.'
            data={['*', 'id', 'name', 'status', 'zone', 'rack', 'bin', 'location_code', 'location_type', 'capacity'].map((f) => ({
              value: f,
              label: f === '*' ? 'All fields (no restriction)' : f,
              disabled: f !== '*' && permForm.fields.includes('*'),
            }))}
            value={permForm.fields}
            onChange={(v) => {
              // If selecting "All fields", clear others
              if (v.includes('*') && !permForm.fields.includes('*')) {
                setPermForm((p) => ({ ...p, fields: ['*'] }));
                return;
              }
              // If selecting a specific field while "All" was active, remove "All"
              if (permForm.fields.includes('*') && v.length > 1) {
                setPermForm((p) => ({ ...p, fields: v.filter((x) => x !== '*') }));
                return;
              }
              setPermForm((p) => ({ ...p, fields: v }));
            }}
            searchable
          />
          <Group justify="flex-end">
            <Button variant="subtle" onClick={closePermModal} disabled={savingPerm}>Cancel</Button>
            <Button onClick={savePerm} loading={savingPerm}>Add Permission</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Access Assignment Modal */}
      <Modal opened={accessModal} onClose={closeAccessModal} title={editingAccessEntry ? `Change Policy for ${editingAccessEntry.roleName}` : 'Assign Policy to Role'} size="sm">
        <Stack gap="md">
          {!editingAccessEntry && (
            <SelectDropdown
              label="Role"
              placeholder="Select role"
              choices={roleChoices}
              value={accessForm.role || null}
              onChange={(v) => setAccessForm((p) => ({ ...p, role: String(v ?? '') }))}
            />
          )}
          {editingAccessEntry && (
            <Text size="sm" c="dimmed">Role: <strong>{editingAccessEntry.roleName}</strong></Text>
          )}
          <SelectDropdown
            label="Policy"
            placeholder="Select policy"
            choices={policyChoices}
            value={accessForm.policy || null}
            onChange={(v) => setAccessForm((p) => ({ ...p, policy: String(v ?? '') }))}
          />
          <Group justify="flex-end">
            <Button variant="subtle" onClick={closeAccessModal} disabled={savingAccess}>Cancel</Button>
            <Button onClick={saveAccess} loading={savingAccess}>{editingAccessEntry ? 'Update Assignment' : 'Assign'}</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
