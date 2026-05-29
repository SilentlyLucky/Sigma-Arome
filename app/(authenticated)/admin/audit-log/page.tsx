'use client';

import { Stack, Title, Text, Alert, Group, Badge } from '@mantine/core';
import { CollectionList } from '@/components/ui/collection-list';
import { IconInfoCircle, IconLock } from '@tabler/icons-react';

/**
 * Admin Audit Log Page
 *
 * Uses DaaS built-in daas_activity collection — automatic audit trail
 * for all item mutations. Per PRD AUDIT-001 through AUDIT-004.
 *
 * DaaS automatically logs: user, action, collection, item, timestamp.
 * Audit log is read-only for all users (AUDIT-003).
 * Admin and Manager can view (AUDIT-004).
 */
export default function AuditLogPage() {
  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-start">
        <div>
          <Title order={2}>Audit Log</Title>
          <Text c="dimmed" size="sm">
            System activity log — all critical actions are recorded automatically by DaaS.
            This log is read-only and cannot be modified or deleted.
          </Text>
        </div>
        <Badge leftSection={<IconLock size={12} />} variant="light" color="gray">
          Read-Only
        </Badge>
      </Group>

      <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
        The DaaS platform automatically records all item create, update, and delete operations in the activity log.
        This includes all admin changes, PPIC orders, QC decisions, warehouse operations, and production events.
        Records include: user, action, collection, item ID, and timestamp.
      </Alert>

      <CollectionList
        collection="daas_activity"
        enableSearch
        enableFilter
        enableSort
        fields={['action', 'collection', 'item', 'user_id', 'timestamp', 'ip']}
        limit={50}
      />
    </Stack>
  );
}
