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
  // Material requests are created from product formulas when a production order is submitted.
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
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Title order={4} c="teal">Sigma Arome</Title>
            <Text size="xs" c="dimmed" visibleFrom="sm">PPIC Planning</Text>
          </Group>
          <Group gap="xs">
            <NotificationBell role="ppic" />
            <Menu shadow="md" width={200}>
              <Menu.Target>
                <ActionIcon variant="subtle" size="lg" radius="xl">
                  <Avatar size="sm" color="teal">P</Avatar>
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item leftSection={<IconSettings size={14} />}>Settings</Menu.Item>
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
              {idx > 0 && <Divider my="xs" />}
              <Text size="xs" c="dimmed" fw={700} tt="uppercase" px="xs" py={4}>{section}</Text>
              {items.map((item) => (
                <NavLink
                  key={item.href}
                  component={Link}
                  href={item.href}
                  label={item.label}
                  leftSection={<item.icon size={16} />}
                  active={pathname === item.href || (item.href !== '/ppic' && pathname.startsWith(item.href))}
                  variant="light"
                />
              ))}
            </div>
          );
        })}
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
