'use client';

import { AppShell, Box, Burger, Divider, Group, Menu, NavLink, Text, Title, ActionIcon, Avatar } from '@mantine/core';
import { NotificationBell } from '@/components/NotificationBell';
import { useDisclosure } from '@mantine/hooks';
import {
  IconDashboard, IconTruckDelivery, IconBarcode, IconMapPin, IconHistory,
  IconLogout, IconSettings, IconMap, IconWand, IconLeaf,
} from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';

const NAV_ITEMS = [
  { label: 'Dashboard',               href: '/warehouse',           icon: IconDashboard,    section: 'Overview' },
  { label: 'Floor Plan',              href: '/warehouse/map',       icon: IconMap,          section: 'Overview' },
  { label: 'Expected Deliveries',     href: '/warehouse/incoming',  icon: IconTruckDelivery,section: 'Receiving' },
  { label: 'Receive Raw Materials',   href: '/warehouse/receive',   icon: IconTruckDelivery,section: 'Receiving' },
  { label: 'Batch Inventory',         href: '/warehouse/batches',   icon: IconBarcode,      section: 'Inventory' },
  { label: 'Put Away Approved',       href: '/warehouse/putaway',   icon: IconMapPin,       section: 'Inventory' },
  { label: 'Storage Suggestions',     href: '/warehouse/slotting',  icon: IconWand,         section: 'Inventory' },
  { label: 'Movement Log',            href: '/warehouse/movements', icon: IconHistory,      section: 'History' },
];

const SECTIONS = ['Overview', 'Receiving', 'Inventory', 'History'];

export default function WarehouseLayout({ children }: { children: ReactNode }) {
  const [opened, { toggle }] = useDisclosure();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <AppShell
      header={{ height: 64 }}
      navbar={{ width: 268, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="xl"
      styles={{
        header: { backgroundColor: '#FFFFFF', borderBottom: '1px solid #DCE5DD', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' },
        navbar: { backgroundColor: '#FFFFFF', borderRight: '1px solid #DCE5DD' },
        main:   { backgroundColor: '#F4F7F5', minHeight: '100vh' },
      }}
    >
      {/* ── Header ─────────────────────────────────────────── */}
      <AppShell.Header>
        <Group h="100%" px={20} justify="space-between">
          <Group gap={12}>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" color="#4B5563" />
            <Group gap={8}>
              <Box style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#2E7D32', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <IconLeaf size={16} color="white" strokeWidth={2} />
              </Box>
              <div>
                <Text fw={700} size="sm" style={{ color: '#0F172A', lineHeight: 1.1 }}>Sigma Arome</Text>
                <Text size="xs" style={{ color: '#9CA3AF', lineHeight: 1.1 }} visibleFrom="sm">Warehouse</Text>
              </div>
            </Group>
          </Group>

          <Group gap={8}>
            <NotificationBell role="warehouse" />
            <Menu shadow="md" width={200} radius="md">
              <Menu.Target>
                <ActionIcon variant="subtle" size="lg" radius="xl" style={{ color: '#4B5563' }}>
                  <Avatar size={32} color="primary" radius="xl" style={{ cursor: 'pointer' }}>W</Avatar>
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item leftSection={<IconSettings size={14} />} style={{ color: '#4B5563' }}>Settings</Menu.Item>
                <Menu.Divider />
                <Menu.Item leftSection={<IconLogout size={14} />} color="red" onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/login'); }}>
                  Logout
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </AppShell.Header>

      {/* ── Sidebar ────────────────────────────────────────── */}
      <AppShell.Navbar style={{ overflowY: 'auto' }}>
        {/* Brand block */}
        <Box px={20} py={20} style={{ borderBottom: '1px solid #E4EDE5' }}>
          <Text fw={600} size="xs" style={{ color: '#9CA3AF', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>
            Warehouse Ops
          </Text>
          <Title order={5} style={{ color: '#0F172A', fontWeight: 700 }}>Warehouse Operation</Title>
        </Box>

        {/* Nav sections */}
        <Box px={12} py={12}>
          {SECTIONS.map((section, idx) => {
            const items = NAV_ITEMS.filter(i => i.section === section);
            return (
              <Box key={section} mb={4}>
                {idx > 0 && <Divider my={8} color="#E4EDE5" />}
                <Text size="xs" fw={600} tt="uppercase" px={8} style={{ color: '#9CA3AF', letterSpacing: '0.06em', lineHeight: 1, paddingTop: 6, paddingBottom: 8, display: 'block' }}>
                  {section}
                </Text>
                {items.map(item => {
                  const active = pathname === item.href || (item.href !== '/warehouse' && pathname.startsWith(item.href));
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
              </Box>
            );
          })}
        </Box>
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
