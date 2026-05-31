'use client';

import { AppShell, Burger, Group, NavLink, Text, Title, ActionIcon, Menu, Avatar, Divider } from '@mantine/core';
import { NotificationBell } from '@/components/NotificationBell';
import { useDisclosure } from '@mantine/hooks';
import { IconDashboard, IconTruckDelivery, IconBarcode, IconMapPin, IconHistory, IconLogout, IconSettings, IconMap, IconWand, IconPlayerPlay } from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';

// Material Issue tab removed — picking queue is now surfaced directly on the Dashboard
// and driven automatically by active Production Orders.
const NAV_ITEMS = [
  { label: 'Dashboard', href: '/warehouse', icon: IconDashboard, section: 'Overview' },
  { label: 'Warehouse Floor Plan', href: '/warehouse/map', icon: IconMap, section: 'Overview' },
  { label: 'Expected Raw Material Deliveries', href: '/warehouse/incoming', icon: IconTruckDelivery, section: 'Raw Material Receiving' },
  { label: 'Receive Raw Materials', href: '/warehouse/receive', icon: IconTruckDelivery, section: 'Raw Material Receiving' },
  { label: 'Production Orders', href: '/warehouse/production', icon: IconPlayerPlay, section: 'Production Issuing' },
  { label: 'Batch Inventory', href: '/warehouse/batches', icon: IconBarcode, section: 'Inventory' },
  { label: 'Put Away Approved Batches', href: '/warehouse/putaway', icon: IconMapPin, section: 'Inventory' },
  { label: 'Storage Suggestions', href: '/warehouse/slotting', icon: IconWand, section: 'Inventory' },
  { label: 'Inventory Movement History', href: '/warehouse/movements', icon: IconHistory, section: 'History' },
];
const SECTIONS = ['Overview', 'Raw Material Receiving', 'Production Issuing', 'Inventory', 'History'];

export default function WarehouseLayout({ children }: { children: ReactNode }) {
  const [opened, { toggle }] = useDisclosure();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <AppShell header={{ height: 60 }} navbar={{ width: 260, breakpoint: 'sm', collapsed: { mobile: !opened } }} padding="md">
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Title order={4} c="orange">Sigma Arome</Title>
            <Text size="xs" c="dimmed" visibleFrom="sm">Warehouse Operation</Text>
          </Group>
          <Group gap="xs">
            <NotificationBell role="warehouse" />
            <Menu shadow="md" width={200}>
              <Menu.Target><ActionIcon variant="subtle" size="lg" radius="xl"><Avatar size="sm" color="orange">W</Avatar></ActionIcon></Menu.Target>
              <Menu.Dropdown>
                <Menu.Item leftSection={<IconSettings size={14} />}>Settings</Menu.Item>
                <Menu.Divider />
                <Menu.Item leftSection={<IconLogout size={14} />} color="red" onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/login'); }}>Logout</Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </AppShell.Header>
      <AppShell.Navbar p="xs" style={{ overflowY: 'auto' }}>
        {SECTIONS.map((section, idx) => {
          const items = NAV_ITEMS.filter((i) => i.section === section);
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
                  active={pathname === item.href || (item.href !== '/warehouse' && pathname.startsWith(item.href))}
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
