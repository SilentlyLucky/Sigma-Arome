'use client';

import {
  AppShell,
  Box,
  Burger,
  Divider,
  Group,
  Menu,
  NavLink,
  Text,
  Title,
  ActionIcon,
  Avatar,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconDashboard,
  IconUsers,
  IconBuildingFactory2,
  IconFlask,
  IconPackage,
  IconMapPin,
  IconAlertTriangle,
  IconChecklist,
  IconDeviceDesktopAnalytics,
  IconFileText,
  IconLogout,
  IconSettings,
  IconShieldCheck,
  IconEye,
  IconClick,
  IconUserShield,
  IconLeaf,
} from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';

interface NavItem {
  label: string;
  href: string;
  icon: typeof IconDashboard;
  section?: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: IconDashboard, section: 'Overview' },
  { label: 'Users', href: '/admin/users', icon: IconUsers, section: 'Access Control' },
  { label: 'Roles', href: '/admin/roles', icon: IconUserShield, section: 'Access Control' },
  { label: 'Page Access', href: '/admin/permissions', icon: IconShieldCheck, section: 'Access Control' },
  { label: 'Visible Fields', href: '/admin/field-visibility', icon: IconEye, section: 'Access Control' },
  { label: 'Allowed Actions', href: '/admin/action-permissions', icon: IconClick, section: 'Access Control' },
  { label: 'Suppliers', href: '/admin/suppliers', icon: IconBuildingFactory2, section: 'Master Data' },
  { label: 'Raw Materials', href: '/admin/raw-materials', icon: IconFlask, section: 'Master Data' },
  { label: 'Products', href: '/admin/products', icon: IconPackage, section: 'Master Data' },
  { label: 'Warehouse Locations', href: '/admin/warehouse-locations', icon: IconMapPin, section: 'Master Data' },
  { label: 'Hazard Classes', href: '/admin/hazard-classes', icon: IconAlertTriangle, section: 'Master Data' },
  { label: 'Quality Check Forms', href: '/admin/qc-templates', icon: IconChecklist, section: 'Master Data' },
  { label: 'IoT Sensors', href: '/admin/iot-sensors', icon: IconDeviceDesktopAnalytics, section: 'Master Data' },
  { label: 'Audit Log', href: '/admin/audit-log', icon: IconFileText, section: 'Audit' },
];

const SECTIONS = ['Overview', 'Access Control', 'Master Data', 'Audit'];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [opened, { toggle }] = useDisclosure();
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <AppShell
      header={{ height: 64 }}
      navbar={{ width: 268, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="xl"
      styles={{
        header: {
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #DCE5DD',
          boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
        },
        navbar: {
          backgroundColor: '#FFFFFF',
          borderRight: '1px solid #DCE5DD',
        },
        main: {
          backgroundColor: '#F4F7F5',
          minHeight: '100vh',
        },
      }}
    >
      {/* ── Header ─────────────────────────────────────────── */}
      <AppShell.Header>
        <Group h="100%" px={20} justify="space-between">
          <Group gap={12}>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" color="#4B5563" />
            <Group gap={8}>
              <Box
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  backgroundColor: '#2E7D32',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <IconLeaf size={16} color="white" strokeWidth={2} />
              </Box>
              <div>
                <Text fw={700} size="sm" style={{ color: '#0F172A', lineHeight: 1.1 }}>Sigma Arome</Text>
                <Text size="xs" style={{ color: '#9CA3AF', lineHeight: 1.1 }} visibleFrom="sm">Admin Panel</Text>
              </div>
            </Group>
          </Group>

          <Menu shadow="md" width={200} radius="md">
            <Menu.Target>
              <ActionIcon variant="subtle" size="lg" radius="xl" style={{ color: '#4B5563' }}>
                <Avatar size={32} color="primary" radius="xl" style={{ cursor: 'pointer' }}>A</Avatar>
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item leftSection={<IconSettings size={14} />} style={{ color: '#4B5563' }}>
                Settings
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item leftSection={<IconLogout size={14} />} color="red" onClick={handleLogout}>
                Logout
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </AppShell.Header>

      {/* ── Sidebar ────────────────────────────────────────── */}
      <AppShell.Navbar style={{ overflowY: 'auto' }}>
        {/* Brand block */}
        <Box px={20} py={20} style={{ borderBottom: '1px solid #E4EDE5' }}>
          <Text fw={600} size="xs" style={{ color: '#9CA3AF', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>
            Control Center
          </Text>
          <Title order={5} style={{ color: '#0F172A', fontWeight: 700 }}>Administration</Title>
        </Box>

        {/* Nav sections */}
        <Box px={12} py={12}>
          {SECTIONS.map((section, sectionIdx) => {
            const items = NAV_ITEMS.filter((item) => item.section === section);
            return (
              <Box key={section} mb={4}>
                {sectionIdx > 0 && (
                  <Divider my={8} color="#E4EDE5" />
                )}
                <Text
                  size="xs"
                  fw={600}
                  tt="uppercase"
                  px={8}
                  style={{
                    color: '#9CA3AF',
                    letterSpacing: '0.06em',
                    lineHeight: 1,
                    paddingTop: 6,
                    paddingBottom: 8,
                    display: 'block',
                  }}
                >
                  {section}
                </Text>
                {items.map((item) => (
                  <NavLink
                    key={item.href}
                    component={Link}
                    href={item.href}
                    label={item.label}
                    leftSection={
                      <item.icon
                        size={16}
                        strokeWidth={1.75}
                        style={{ color: pathname === item.href ? '#1B5E20' : '#6B7280' }}
                      />
                    }
                    active={pathname === item.href}
                    variant="light"
                    color="primary"
                    style={{
                      color: pathname === item.href ? '#1B5E20' : '#4B5563',
                      fontWeight: pathname === item.href ? 600 : 500,
                    }}
                  />
                ))}
              </Box>
            );
          })}
        </Box>
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
