'use client';

import {
  ActionIcon,
  AppShell,
  Avatar,
  Box,
  Burger,
  Group,
  Indicator,
  Menu,
  NavLink,
  Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  Bell,
  ClipboardCheck,
  Eye,
  Factory,
  FileText,
  FlaskConical,
  Home,
  LockKeyhole,
  LogOut,
  MapPin,
  Package,
  RadioTower,
  Settings2,
  Shield,
  Sparkles,
  TriangleAlert,
  UserCog,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import styles from './layout.module.css';

interface CurrentUser {
  email: string;
  first_name: string | null;
  last_name: string | null;
}

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  section: string;
}

function getInitials(first: string | null, last: string | null, email: string): string {
  if (first && last) return `${first[0]}${last[0]}`.toUpperCase();
  if (first) return first[0].toUpperCase();
  return email[0]?.toUpperCase() ?? 'A';
}

function getDisplayName(user: CurrentUser | null): string {
  if (!user) return 'Account';
  return [user.first_name, user.last_name].filter(Boolean).join(' ') || user.email;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: Home, section: 'Overview' },
  { label: 'Users', href: '/admin/users', icon: Users, section: 'Access Control' },
  { label: 'Roles', href: '/admin/roles', icon: UserCog, section: 'Access Control' },
  { label: 'Page Access', href: '/admin/permissions', icon: Shield, section: 'Access Control' },
  { label: 'Visible Fields', href: '/admin/field-visibility', icon: Eye, section: 'Access Control' },
  { label: 'Allowed Actions', href: '/admin/action-permissions', icon: Settings2, section: 'Access Control' },
  { label: 'Suppliers', href: '/admin/suppliers', icon: Factory, section: 'Master Data' },
  { label: 'Raw Materials', href: '/admin/raw-materials', icon: FlaskConical, section: 'Master Data' },
  { label: 'Products', href: '/admin/products', icon: Package, section: 'Master Data' },
  { label: 'Warehouse Locations', href: '/admin/warehouse-locations', icon: MapPin, section: 'Master Data' },
  { label: 'Hazard Classes', href: '/admin/hazard-classes', icon: TriangleAlert, section: 'Master Data' },
  { label: 'Quality Check Forms', href: '/admin/qc-templates', icon: ClipboardCheck, section: 'Master Data' },
  { label: 'IoT Sensors', href: '/admin/iot-sensors', icon: RadioTower, section: 'Master Data' },
  { label: 'Audit Log', href: '/admin/audit-log', icon: FileText, section: 'Audit' },
];

const SECTIONS = ['Overview', 'Access Control', 'Master Data', 'Audit'];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [opened, { toggle }] = useDisclosure();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch('/api/auth/user');
        if (!res.ok) return;
        const data = await res.json();
        setUser(data.data as CurrentUser);
      } catch {
        setUser(null);
      }
    }

    loadUser();
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const displayName = getDisplayName(user);
  const initials = user ? getInitials(user.first_name, user.last_name, user.email) : 'A';

  return (
    <AppShell
      navbar={{ width: 268, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding={0}
      styles={{
        navbar: {
          top: 0,
          height: '100dvh',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,249,248,0.96) 100%)',
          borderRight: '1px solid rgba(226, 229, 226, 0.95)',
          boxShadow: '10px 0 34px rgba(15, 23, 42, 0.035)',
          backdropFilter: 'blur(16px)',
        },
        main: {
          minHeight: '100vh',
          background:
            'radial-gradient(circle at 78% 0%, rgba(255,255,255,0.92) 0%, rgba(247,248,247,0.72) 28%, transparent 52%), radial-gradient(circle at 14% 8%, rgba(243,244,245,0.9) 0%, rgba(247,248,247,0.5) 34%, transparent 58%), linear-gradient(180deg, #F3F4F5 0%, #F7F8F7 22%, #F7F8F7 100%)',
        },
      }}
    >
      <AppShell.Navbar style={{ overflowY: 'auto' }}>
        <Box px={20} py={22}>
          <Group gap={12} wrap="nowrap" align="center">
            <Image
              src="/SIGMA_AROME_LOGO_ONLY.png"
              alt="Sigma Arome logo"
              width={46}
              height={46}
              style={{ objectFit: 'contain' }}
              priority
            />
            <Box style={{ minWidth: 0 }}>
              <Text fw={850} size="lg" style={{ color: '#102033', letterSpacing: '-0.025em', lineHeight: 1.05 }}>
                Sigma Arome
              </Text>
              <Text size="sm" fw={500} style={{ color: '#5F6C7B', lineHeight: 1.25 }}>
                Admin Panel
              </Text>
            </Box>
          </Group>
        </Box>

        <Box px={12} pb={22}>
          {SECTIONS.map((section) => {
            const items = NAV_ITEMS.filter((item) => item.section === section);
            return (
              <Box key={section} mb={14}>
                <Text
                  size="xs"
                  fw={800}
                  tt="uppercase"
                  px={12}
                  style={{
                    color: '#6E7B8B',
                    letterSpacing: '0.06em',
                    paddingTop: 2,
                    paddingBottom: 8,
                  }}
                >
                  {section}
                </Text>
                <Box>
                  {items.map((item) => {
                    const active = pathname === item.href;
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.href}
                        component={Link}
                        href={item.href}
                        label={item.label}
                        leftSection={<Icon size={17} strokeWidth={2} color={active ? '#1F8F3A' : '#536273'} />}
                        active={active}
                        variant="light"
                        color="green"
                        styles={{
                          root: {
                            borderRadius: 10,
                            marginBottom: 4,
                            color: active ? '#1F8F3A' : '#243246',
                            fontWeight: active ? 800 : 600,
                            backgroundColor: active ? '#EAF6EC' : 'transparent',
                            borderLeft: active ? '3px solid #1F8F3A' : '3px solid transparent',
                          },
                          label: {
                            fontSize: 14,
                          },
                        }}
                      />
                    );
                  })}
                </Box>
              </Box>
            );
          })}
        </Box>
      </AppShell.Navbar>

      <AppShell.Main>
        <Box className={styles.pageFrame}>
          <Group className={styles.topBar} gap={14}>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" color="#17212F" />
            <Group gap={8}>
              <Box style={{ width: 38, height: 38, borderRadius: '50%', backgroundColor: '#FFFFFF', border: '1px solid rgba(218,226,214,0.9)', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Indicator color="#16A34A" size={8} offset={5}>
                  <ActionIcon
                    variant="subtle"
                    radius="xl"
                    size={34}
                    aria-label="Notifications"
                    style={{ color: '#17212F' }}
                  >
                    <Bell size={19} strokeWidth={2} />
                  </ActionIcon>
                </Indicator>
              </Box>
              <Menu shadow="md" width={200} radius="md" position="bottom-end">
                <Menu.Target>
                  <Avatar
                    size={38}
                    radius="xl"
                    styles={{ root: { cursor: 'pointer', border: '1px solid rgba(218,226,214,0.9)', background: '#FFFFFF', color: '#1F8F3A', fontWeight: 800, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' } }}
                  >
                    {initials}
                  </Avatar>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Label>{displayName}</Menu.Label>
                  <Menu.Item leftSection={<Sparkles size={14} />} onClick={() => router.push('/account/settings')}>
                    Settings
                  </Menu.Item>
                  <Menu.Divider />
                  <Menu.Item leftSection={<LogOut size={14} />} color="red" onClick={handleLogout}>
                    Logout
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </Group>
          </Group>
          {children}
        </Box>
      </AppShell.Main>
    </AppShell>
  );
}
