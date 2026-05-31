'use client';

import {
  AppShell,
  Burger,
  Group,
  NavLink,
  Text,
  Title,
  ActionIcon,
  Menu,
  Avatar,
  Divider,
} from '@mantine/core';
import { NotificationBell } from '@/components/NotificationBell';
import { useDisclosure } from '@mantine/hooks';
import {
  IconDashboard,
  IconShoppingCart,
  IconBuildingFactory,
  IconClipboardList,
  IconPackageExport,
  IconLogout,
  IconSettings,
} from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/ppic', icon: IconDashboard, section: 'Overview' },
  { label: 'Raw Material Orders', href: '/ppic/orders', icon: IconShoppingCart, section: 'Ordering' },
  { label: 'Product Formulas', href: '/ppic/bom', icon: IconClipboardList, section: 'Planning' },
  { label: 'Production Orders', href: '/ppic/production', icon: IconBuildingFactory, section: 'Planning' },
  { label: 'Materials Ready for Production', href: '/ppic/readiness', icon: IconPackageExport, section: 'Monitoring' },
];

const SECTIONS = ['Overview', 'Ordering', 'Planning', 'Monitoring'];

export default function PPICLayout({ children }: { children: ReactNode }) {
  const [opened, { toggle }] = useDisclosure();
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 260, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
      styles={{
        header: { backgroundColor: '#FFFFFF', borderBottom: '1px solid #DCE5DD', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' },
        navbar: { backgroundColor: '#FFFFFF', borderRight: '1px solid #DCE5DD' },
        main:   { background: 'radial-gradient(circle at 72% 0%, rgba(13,74,31,0.12) 0%, rgba(13,74,31,0.05) 28%, transparent 52%), radial-gradient(circle at 18% 18%, rgba(26,107,46,0.10) 0%, transparent 34%), linear-gradient(180deg, #f9fdf9 0%, #f0f6f0 48%, #eaf3ea 100%)', minHeight: '100vh' },
      }}
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" color="#4B5563" />
            <Title order={4} style={{ color: '#2E7D32' }}>Sigma Arome</Title>
            <Text size="xs" style={{ color: '#9CA3AF' }} visibleFrom="sm">PPIC Planning</Text>
          </Group>
          <Group gap="xs">
            <NotificationBell role="ppic" />
            <Menu shadow="md" width={200} radius="md">
              <Menu.Target>
                <ActionIcon variant="subtle" size="lg" radius="xl">
                  <Avatar size="sm" color="primary">P</Avatar>
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item leftSection={<IconSettings size={14} />} style={{ color: '#4B5563' }} onClick={() => router.push('/account/settings')}>Settings</Menu.Item>
                <Menu.Divider />
                <Menu.Item leftSection={<IconLogout size={14} />} color="red" onClick={handleLogout}>Logout</Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="xs" style={{ overflowY: 'auto' }}>
        {SECTIONS.map((section, idx) => {
          const items = NAV_ITEMS.filter((item) => item.section === section);
          return (
            <div key={section}>
              {idx > 0 && <Divider my="xs" color="#E4EDE5" />}
              <Text size="xs" fw={600} tt="uppercase" px="xs" py={4} style={{ color: '#9CA3AF', letterSpacing: '0.06em' }}>{section}</Text>
              {items.map((item) => {
                const active = pathname === item.href || (item.href !== '/ppic' && pathname.startsWith(item.href));
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
