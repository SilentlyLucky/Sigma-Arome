'use client';

import {
  ActionIcon,
  Box,
  Group,
  Indicator,
  Popover,
  ScrollArea,
  Stack,
  Text,
  UnstyledButton,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconBell, IconCircleCheck } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/lib/hooks/useNotifications';

interface NotificationBellProps {
  role: string;
}

// Full paths from DB triggers — used as fallback when link field is empty.
const TYPE_TO_PATH: Record<string, string> = {
  material_order_created:          '/warehouse/incoming',
  batch_received_qc:               '/qc/queue',
  material_order_received:         '/ppic/orders',
  batch_qc_approved:               '/warehouse/putaway',
  batch_qc_rejected:               '/warehouse/batches',
  batch_qc_rejected_ppic:          '/ppic/orders',
  batch_on_hold:                   '/warehouse/batches',
  batch_on_hold_ppic:              '/ppic/orders',
  production_order_released:       '/warehouse/production',
  production_order_started:        '/production/orders',
  production_order_completed_wh:   '/warehouse/batches',
  production_order_completed_ppic: '/ppic/production',
  material_request_submitted:      '/logistic/requests',
  material_request_coordinated:    '/warehouse/issue',
};

const ROLE_DASHBOARD: Record<string, string> = {
  warehouse:  '/warehouse',
  qc:         '/qc',
  ppic:       '/ppic',
  logistic:   '/logistic',
  production: '/production',
  manager:    '/manager',
  admin:      '/admin',
};

export function NotificationBell({ role }: NotificationBellProps) {
  const [opened, { toggle, close }] = useDisclosure(false);
  const router = useRouter();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications(role);

  const handleClick = (id: string, link: string, type: string) => {
    // Resolve destination: prefer stored link → type map → role dashboard
    const destination =
      (link && link.length > 1)
        ? link
        : (TYPE_TO_PATH[type] ?? ROLE_DASHBOARD[role] ?? '/');

    markRead(id); // fire-and-forget — don't block navigation
    close();
    router.push(destination);
  };

  const formatTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <Popover
      opened={opened}
      onClose={close}
      position="bottom-end"
      width={360}
      shadow="md"
      withinPortal
    >
      <Popover.Target>
        <Indicator
          label={unreadCount > 0 ? String(unreadCount) : undefined}
          size={16}
          color="red"
          disabled={unreadCount === 0}
          processing={unreadCount > 0}
        >
          <ActionIcon
            variant="subtle"
            size="lg"
            radius="xl"
            onClick={toggle}
            aria-label="Notifications"
          >
            <IconBell size={20} />
          </ActionIcon>
        </Indicator>
      </Popover.Target>

      <Popover.Dropdown p={0}>
        <Group
          justify="space-between"
          px="md"
          py="sm"
          style={{ borderBottom: '1px solid #e9f0e8', backgroundColor: '#ffffff' }}
        >
          <Text fw={700} size="sm" style={{ color: '#15231b' }}>Notifications</Text>
          <UnstyledButton
            onClick={markAllRead}
            style={{
              opacity: unreadCount === 0 ? 0.4 : 1,
              pointerEvents: unreadCount === 0 ? 'none' : 'auto',
            }}
          >
            <Text size="xs" style={{ color: '#2f8f2f', fontWeight: 600 }}>Mark all read</Text>
          </UnstyledButton>
        </Group>

        <ScrollArea mah={400}>
          {notifications.length === 0 ? (
            <Stack align="center" gap="xs" py="xl" px="md">
              <IconCircleCheck size={32} color="#2f8f2f" />
              <Text size="sm" style={{ color: '#5e6977' }}>You&apos;re all caught up</Text>
            </Stack>
          ) : (
            <Stack gap={0}>
              {notifications.map((notif) => (
                <UnstyledButton
                  key={notif.id}
                  onClick={() => handleClick(notif.id, notif.link, notif.type)}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: 'var(--mantine-spacing-sm) var(--mantine-spacing-md)',
                    borderBottom: '1px solid #e9f0e8',
                    background: notif.read ? '#ffffff' : '#eef7ed',
                  }}
                >
                  <Group gap="xs" wrap="nowrap" align="flex-start">
                    <Box
                      w={3}
                      h={36}
                      style={{
                        borderRadius: 2,
                        flexShrink: 0,
                        background: notif.read ? '#d1ddd5' : '#2f8f2f',
                      }}
                    />
                    <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                      <Group justify="space-between" wrap="nowrap">
                        <Text size="sm" fw={notif.read ? 400 : 700} lineClamp={1}
                          style={{ color: notif.read ? '#5e6977' : '#15231b' }}>
                          {notif.title}
                        </Text>
                        <Text size="xs" style={{ flexShrink: 0, color: '#667085' }}>
                          {formatTime(notif.created_at)}
                        </Text>
                      </Group>
                      <Text size="xs" lineClamp={2} style={{ color: '#5e6977' }}>
                        {notif.message}
                      </Text>
                    </Stack>
                  </Group>
                </UnstyledButton>
              ))}
            </Stack>
          )}
        </ScrollArea>
      </Popover.Dropdown>
    </Popover>
  );
}
