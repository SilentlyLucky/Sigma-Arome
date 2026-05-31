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
  Button,
  Modal,
  MultiSelect,
  ActionIcon,
  Tooltip,
  Code,
  Divider,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconEye,
  IconEyeOff,
  IconAlertCircle,
  IconEdit,
  IconRefresh,
  IconInfoCircle,
} from '@tabler/icons-react';
import { useCallback, useEffect, useState } from 'react';
import { useDaaSContext } from '@/lib/buildpad/services/daas-context';
import { SelectDropdown } from '@/components/ui/select-dropdown';

/**
 * Field Visibility Configuration
 *
 * Reads live DaaS permission field arrays per policy and lets Admin
 * edit which fields each policy (and therefore each role) can see.
 *
 * Per PRD Section 9 — Role-Based UI and Data Visibility Requirements.
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

// Known fields per collection (from DaaS schema)
const COLLECTION_FIELDS: Record<string, string[]> = {
  suppliers: ['id', 'supplier_name', 'contact_person', 'email', 'phone', 'address', 'status', 'notes'],
  raw_materials: ['id', 'name', 'code', 'category', 'unit', 'storage_temp_min', 'storage_temp_max', 'shelf_life_days', 'hazard_class_id', 'status', 'notes'],
  products: ['id', 'name', 'code', 'category', 'unit', 'storage_temp_min', 'storage_temp_max', 'status', 'notes'],
  warehouses: ['id', 'code', 'name', 'description', 'status'],
  zones: ['id', 'code', 'name', 'warehouse_id', 'temperature_min', 'temperature_max', 'status'],
  racks: ['id', 'code', 'zone_id', 'capacity_kg', 'status'],
  warehouse_locations: ['id', 'location_code', 'rack_id', 'zone', 'capacity_kg', 'current_occupancy_kg', 'capacity_pcs', 'current_occupancy_pcs', 'temperature_min', 'temperature_max', 'allowed_hazard_classes', 'status', 'is_active'],
  hazard_classes: ['id', 'name', 'code', 'description', 'color'],
  qc_templates: ['id', 'name', 'target_type', 'material_id', 'product_id', 'parameters', 'status'],
  iot_sensors: ['id', 'sensor_name', 'sensor_code', 'location_id', 'sensor_type', 'temp_threshold_min', 'temp_threshold_max', 'humidity_threshold_min', 'humidity_threshold_max', 'status', 'calibration_due_date', 'is_simulated'],
  inventory: ['id', 'status', 'qty', 'unit'],
};

const COLLECTIONS = Object.keys(COLLECTION_FIELDS);
const OPERATIONAL_ROLES = ['Administrator', 'Manager', 'PPIC', 'Warehouse Operation', 'QC', 'Logistic', 'Production'];

export default function FieldVisibilityPage() {
  const { getHeaders } = useDaaSContext();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [accessEntries, setAccessEntries] = useState<AccessEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<string>('suppliers');

  // Edit modal
  const [editModal, { open: openEdit, close: closeEdit }] = useDisclosure(false);
  const [editingPerm, setEditingPerm] = useState<Permission | null>(null);
  const [editFields, setEditFields] = useState<string[]>(['*']);
  const [saving, setSaving] = useState(false);

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

  const getRoleForPolicy = (policyId: string): string => {
    const entry = accessEntries.find((a) => a.policy === policyId);
    if (!entry?.role) return '—';
    return roles.find((r) => r.id === entry.role)?.name ?? '—';
  };

  // Get read permissions for the selected collection, grouped by policy
  const collectionReadPerms = permissions.filter(
    (p) => p.collection === selectedCollection && p.action === 'read'
  );

  const openEditFields = (perm: Permission) => {
    setEditingPerm(perm);
    setEditFields(perm.fields?.length ? perm.fields : ['*']);
    openEdit();
  };

  const saveFields = async () => {
    if (!editingPerm) return;
    setSaving(true);
    try {
      const headers = { 'Content-Type': 'application/json', ...(await getHeaders()) };
      const res = await fetch(`/api/permissions/${editingPerm.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ fields: editFields.length ? editFields : ['*'] }),
      });
      if (!res.ok) throw new Error((await res.json())?.errors?.[0]?.message ?? 'Save failed');
      notifications.show({ title: 'Saved', message: 'Field visibility updated', color: 'green' });
      closeEdit();
      fetchAll();
    } catch (err) {
      notifications.show({ title: 'Error', message: err instanceof Error ? err.message : 'Save failed', color: 'red' });
    } finally {
      setSaving(false);
    }
  };

  const knownFields = COLLECTION_FIELDS[selectedCollection] ?? [];
  const isAllFieldsSelected = editFields.includes('*');
  const fieldOptions = [
    { value: '*', label: 'All fields (no restriction)' },
    ...knownFields.map((f) => ({ value: f, label: f, disabled: isAllFieldsSelected })),
  ];

  const handleFieldsChange = (values: string[]) => {
    // If user just selected "All fields", clear everything else
    if (values.includes('*') && !editFields.includes('*')) {
      setEditFields(['*']);
      return;
    }
    // If user selected a specific field while "All fields" was active, remove "All fields"
    if (editFields.includes('*') && values.length > 1) {
      setEditFields(values.filter((v) => v !== '*'));
      return;
    }
    setEditFields(values);
  };

  // Build matrix: for each operational role, find their policy's read permission for this collection
  const rolePermMatrix = OPERATIONAL_ROLES.map((roleName) => {
    const role = roles.find((r) => r.name === roleName);
    if (!role) return { roleName, perm: null, isAdmin: false };
    const rolePolicyIds = accessEntries.filter((a) => a.role === role.id).map((a) => a.policy);
    const adminPolicy = policies.find((p) => rolePolicyIds.includes(p.id) && p.admin_access);
    if (adminPolicy) return { roleName, perm: null, isAdmin: true };
    const perm = collectionReadPerms.find((p) => rolePolicyIds.includes(p.policy));
    return { roleName, perm: perm ?? null, isAdmin: false };
  });

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-start">
        <div>
          <Title order={2}>Field Visibility Configuration</Title>
          <Text c="dimmed" size="sm">
            Choose which information each role can see on every data screen. Changes apply immediately.
          </Text>
        </div>
        <Tooltip label="Refresh">
          <ActionIcon variant="subtle" onClick={fetchAll} loading={loading}>
            <IconRefresh size={16} />
          </ActionIcon>
        </Tooltip>
      </Group>

      <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
        <strong>Administrator</strong> always sees everything. For other roles, select &quot;All fields&quot;
        for full visibility or pick specific fields to limit what they can view.
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
                <Table.Th style={{ minWidth: 120 }}>Access Level</Table.Th>
                <Table.Th>Visible Fields</Table.Th>
                <Table.Th style={{ width: 60 }}>Edit</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rolePermMatrix.map(({ roleName, perm, isAdmin }) => (
                <Table.Tr key={roleName}>
                  <Table.Td>
                    <Text size="sm" fw={500}>{roleName}</Text>
                  </Table.Td>
                  <Table.Td>
                    {isAdmin ? (
                      <Badge size="xs" color="red" variant="light">Admin — all fields</Badge>
                    ) : perm ? (
                      <Badge size="xs" color="green" variant="light" leftSection={<IconEye size={10} />}>Read</Badge>
                    ) : (
                      <Badge size="xs" color="gray" variant="light" leftSection={<IconEyeOff size={10} />}>No Access</Badge>
                    )}
                  </Table.Td>
                  <Table.Td>
                    {isAdmin ? (
                      <Text size="xs" c="dimmed">All fields (admin bypass)</Text>
                    ) : perm ? (
                      <Group gap={4} wrap="wrap">
                        {(perm.fields?.includes('*') || !perm.fields?.length) ? (
                          <Badge size="xs" variant="dot" color="green">All fields</Badge>
                        ) : (
                          perm.fields?.map((f) => (
                            <Code key={f} fz="xs">{f}</Code>
                          ))
                        )}
                      </Group>
                    ) : (
                      <Text size="xs" c="dimmed">—</Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    {perm && !isAdmin && (
                      <Tooltip label="Edit visible fields">
                        <ActionIcon size="sm" variant="subtle" onClick={() => openEditFields(perm)}>
                          <IconEdit size={14} />
                        </ActionIcon>
                      </Tooltip>
                    )}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Paper>
      )}

      <Paper p="md" radius="md" withBorder>
        <Text fw={600} size="sm" mb="xs">Known Fields — {selectedCollection}</Text>
        <Group gap={4} wrap="wrap">
          {knownFields.map((f) => <Code key={f} fz="xs">{f}</Code>)}
        </Group>
      </Paper>

      {/* Edit Fields Modal */}
      <Modal opened={editModal} onClose={closeEdit} title="Edit Visible Fields" size="md">
        {editingPerm && (
          <Stack gap="md">
            <Group gap="xs">
              <Text size="sm">Policy:</Text>
              <Badge size="sm" variant="light">{policies.find((p) => p.id === editingPerm.policy)?.name ?? editingPerm.policy}</Badge>
              <Text size="sm">→ Role:</Text>
              <Badge size="sm" variant="outline">{getRoleForPolicy(editingPerm.policy)}</Badge>
            </Group>
            <Text size="xs" c="dimmed">Collection: <Code fz="xs">{editingPerm.collection}</Code> / Action: <Code fz="xs">{editingPerm.action}</Code></Text>
            <Divider />
            <MultiSelect
              label="Visible Fields"
              description='Select "All fields" to grant full access, or pick specific fields to restrict what this role can see.'
              data={fieldOptions}
              value={editFields}
              onChange={handleFieldsChange}
              searchable
            />
            <Alert color="yellow" variant="light" icon={<IconInfoCircle size={14} />}>
              Removing a field hides that information from this role throughout the app.
            </Alert>
            <Group justify="flex-end">
              <Button variant="subtle" onClick={closeEdit} disabled={saving}>Cancel</Button>
              <Button onClick={saveFields} loading={saving}>Save Field Visibility</Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Stack>
  );
}
