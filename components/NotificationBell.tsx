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

export function NotificationBell({ role }: NotificationBellProps) {
  const [opened, { toggle, close }] = useDisclosure(false);
  const router = useRouter();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications(role);

  const handleClick = async (id: string, link: string) => {
    await markRead(id);
    close();
    router.push(link);
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
          style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}
        >
          <Text fw={600} size="sm">Notifications</Text>
          <UnstyledButton
            onClick={markAllRead}
            style={{
              opacity: unreadCount === 0 ? 0.4 : 1,
              pointerEvents: unreadCount === 0 ? 'none' : 'auto',
            }}
          >
            <Text size="xs" c="dimmed">Mark all read</Text>
          </UnstyledButton>
        </Group>

        <ScrollArea mah={400}>
          {notifications.length === 0 ? (
            <Stack align="center" gap="xs" py="xl" px="md">
              <IconCircleCheck size={32} color="var(--mantine-color-green-6)" />
              <Text size="sm" c="dimmed">You&apos;re all caught up</Text>
            </Stack>
          ) : (
            <Stack gap={0}>
              {notifications.map((notif) => (
                <UnstyledButton
                  key={notif.id}
                  onClick={() => handleClick(notif.id, notif.link)}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: 'var(--mantine-spacing-sm) var(--mantine-spacing-md)',
                    borderBottom: '1px solid var(--mantine-color-default-border)',
                    background: notif.read
                      ? undefined
                      : 'var(--mantine-color-blue-light)',
                  }}
                >
                  <Group gap="xs" wrap="nowrap" align="flex-start">
                    <Box
                      w={3}
                      h={36}
                      style={{
                        borderRadius: 2,
                        flexShrink: 0,
                        background: notif.read
                          ? 'var(--mantine-color-default-border)'
                          : 'var(--mantine-color-blue-6)',
                      }}
                    />
                    <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                      <Group justify="space-between" wrap="nowrap">
                        <Text size="sm" fw={notif.read ? 400 : 600} lineClamp={1}>
                          {notif.title}
                        </Text>
                        <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>
                          {formatTime(notif.created_at)}
                        </Text>
                      </Group>
                      <Text size="xs" c="dimmed" lineClamp={2}>
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
