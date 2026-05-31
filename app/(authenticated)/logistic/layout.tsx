'use client';

import { AppShell, Burger, Group, NavLink, Text, Title, ActionIcon, Menu, Avatar, Divider } from '@mantine/core';
import { NotificationBell } from '@/components/NotificationBell';
import { useDisclosure } from '@mantine/hooks';
import { IconDashboard, IconClipboardList, IconArrowsSort, IconTransferOut, IconPackage, IconLogout, IconSettings } from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/logistic', icon: IconDashboard, section: 'Overview' },
  { label: 'Material Requests to Review', href: '/logistic/requests', icon: IconClipboardList, section: 'Coordination' },
  { label: 'Material Move Priorities', href: '/logistic/priority', icon: IconArrowsSort, section: 'Coordination' },
  { label: 'Material Release Progress', href: '/logistic/issue-monitor', icon: IconTransferOut, section: 'Monitoring' },
  { label: 'Finished Goods Storage', href: '/logistic/fg-putaway', icon: IconPackage, section: 'Monitoring' },
];
const SECTIONS = ['Overview', 'Coordination', 'Monitoring'];

export default function LogisticLayout({ children }: { children: ReactNode }) {
  const [opened, { toggle }] = useDisclosure();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 260, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
      styles={{
        header: { backgroundColor: '#FFFFFF', borderBottom: '1px solid #DCE5DD', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' },
        navbar: { backgroundColor: '#FFFFFF', borderRight: '1px solid #DCE5DD' },
        main:   { backgroundColor: '#F4F7F5', minHeight: '100vh' },
      }}
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" color="#4B5563" />
            <Title order={4} style={{ color: '#2E7D32' }}>Sigma Arome</Title>
            <Text size="xs" style={{ color: '#9CA3AF' }} visibleFrom="sm">Logistic Coordination</Text>
          </Group>
          <Group gap="xs">
            <NotificationBell role="logistic" />
            <Menu shadow="md" width={200} radius="md">
              <Menu.Target>
                <ActionIcon variant="subtle" size="lg" radius="xl">
                  <Avatar size="sm" color="primary">L</Avatar>
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item leftSection={<IconSettings size={14} />} style={{ color: '#4B5563' }}>Settings</Menu.Item>
                <Menu.Divider />
                <Menu.Item leftSection={<IconLogout size={14} />} color="red" onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/login'); }}>Logout</Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="xs" style={{ overflowY: 'auto' }}>
        {SECTIONS.map((section, idx) => {
          const items = NAV_ITEMS.filter(i => i.section === section);
          return (
            <div key={section}>
              {idx > 0 && <Divider my="xs" color="#E4EDE5" />}
              <Text size="xs" fw={600} tt="uppercase" px="xs" py={4} style={{ color: '#9CA3AF', letterSpacing: '0.06em' }}>{section}</Text>
              {items.map(item => {
                const active = pathname === item.href || (item.href !== '/logistic' && pathname.startsWith(item.href));
                return (
                  <NavLink
                    key={item.href}
                    component={Link}
                    href={item.href}
                    label={item.label}
                    leftSection={<item.icon size={16} strokeWidth={1.75} style={{ color: active ? '#1B5E20' : '#6B7280' }} />}
                    active={active}
                    variant="light"
                    color="primary"
                    style={{ color: active ? '#1B5E20' : '#4B5563', fontWeight: active ? 600 : 500 }}
                  />
                );
              })}
            </div>
          );
        })}
      </AppShell.Navbar>
      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
