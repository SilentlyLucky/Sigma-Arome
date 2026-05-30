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
  // Overview
  { label: 'Dashboard', href: '/admin', icon: IconDashboard, section: 'Overview' },

  // Access Control
  { label: 'User Management', href: '/admin/users', icon: IconUsers, section: 'Access Control' },
  { label: 'Role Management', href: '/admin/roles', icon: IconUserShield, section: 'Access Control' },
  { label: 'Module Permissions', href: '/admin/permissions', icon: IconShieldCheck, section: 'Access Control' },
  { label: 'Field Visibility', href: '/admin/field-visibility', icon: IconEye, section: 'Access Control' },
  { label: 'Action Permissions', href: '/admin/action-permissions', icon: IconClick, section: 'Access Control' },

  // Master Data
  { label: 'Suppliers', href: '/admin/suppliers', icon: IconBuildingFactory2, section: 'Master Data' },
  { label: 'Raw Materials', href: '/admin/raw-materials', icon: IconFlask, section: 'Master Data' },
  { label: 'Products', href: '/admin/products', icon: IconPackage, section: 'Master Data' },
  { label: 'Warehouse Locations', href: '/admin/warehouse-locations', icon: IconMapPin, section: 'Master Data' },
  { label: 'Hazard Classes', href: '/admin/hazard-classes', icon: IconAlertTriangle, section: 'Master Data' },
  { label: 'QC Templates', href: '/admin/qc-templates', icon: IconChecklist, section: 'Master Data' },
  { label: 'IoT Sensors', href: '/admin/iot-sensors', icon: IconDeviceDesktopAnalytics, section: 'Master Data' },

  // Audit
  { label: 'Audit Log', href: '/admin/audit-log', icon: IconFileText, section: 'Audit' },
];

// Group nav items by section
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
      header={{ height: 60 }}
      navbar={{ width: 260, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Title order={4} c="blue">Sigma Arome</Title>
            <Text size="xs" c="dimmed" visibleFrom="sm">Admin Control Center</Text>
          </Group>
          <Menu shadow="md" width={200}>
            <Menu.Target>
              <ActionIcon variant="subtle" size="lg" radius="xl">
                <Avatar size="sm" color="blue">A</Avatar>
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item leftSection={<IconSettings size={14} />}>
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

      <AppShell.Navbar p="xs" style={{ overflowY: 'auto' }}>
        {SECTIONS.map((section, sectionIdx) => {
          const items = NAV_ITEMS.filter((item) => item.section === section);
          return (
            <div key={section}>
              {sectionIdx > 0 && <Divider my="xs" />}
              <Text size="xs" c="dimmed" fw={700} tt="uppercase" px="xs" py={4}>
                {section}
              </Text>
              {items.map((item) => (
                <NavLink
                  key={item.href}
                  component={Link}
                  href={item.href}
                  label={item.label}
                  leftSection={<item.icon size={16} />}
                  active={pathname === item.href}
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
