'use client';

import {
  ActionIcon,
  AppShell,
  Avatar,
  Box,
  Burger,
  Divider,
  Group,
  Menu,
  NavLink,
  Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { LogOut, Settings } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { NotificationBell } from '@/components/NotificationBell';
import styles from './role-app-shell.module.css';

type NavIcon = React.ComponentType<{
  size?: number;
  strokeWidth?: number | string;
  style?: CSSProperties;
  color?: string;
}>;

export interface RoleNavItem {
  label: string;
  href: string;
  icon: NavIcon;
  section: string;
}

interface RoleAppShellProps {
  avatarLabel: string;
  basePath: string;
  children: ReactNode;
  navItems: RoleNavItem[];
  notificationRole: string;
  roleLabel: string;
  sections: string[];
  workspaceEyebrow: string;
  workspaceTitle: string;
}

export function RoleAppShell({
  avatarLabel,
  basePath,
  children,
  navItems,
  notificationRole,
  roleLabel,
  sections,
  workspaceEyebrow,
  workspaceTitle,
}: RoleAppShellProps) {
  const [opened, { toggle }] = useDisclosure();
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <AppShell
      navbar={{ width: 268, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding={0}
      styles={{
        navbar: {
          top: 0,
          height: '100dvh',
          background: 'rgba(255, 255, 255, 0.92)',
          borderRight: '1px solid rgba(218, 226, 214, 0.9)',
          boxShadow: '12px 0 38px rgba(16, 24, 40, 0.035)',
          backdropFilter: 'blur(16px)',
        },
        main: {
          minHeight: '100vh',
          background:
            'radial-gradient(circle at 72% 0%, rgba(13,74,31,0.12) 0%, rgba(13,74,31,0.05) 28%, transparent 52%), radial-gradient(circle at 18% 18%, rgba(26,107,46,0.10) 0%, transparent 34%), linear-gradient(180deg, #f9fdf9 0%, #f0f6f0 48%, #eaf3ea 100%)',
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
                {roleLabel}
              </Text>
            </Box>
          </Group>
        </Box>

        <Box px={18} pb={16}>
          <Text size="xs" fw={800} tt="uppercase" style={{ color: '#6E7B8B', letterSpacing: '0.06em', marginBottom: 10 }}>
            {workspaceEyebrow}
          </Text>
          <Text fw={850} size="md" style={{ color: '#102033', marginBottom: 12 }}>
            {workspaceTitle}
          </Text>
          <Divider color="#E3E9DF" />
        </Box>

        <Box px={12} pb={22}>
          {sections.map((section) => {
            const items = navItems.filter((item) => item.section === section);
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
                    const active = pathname === item.href || (item.href !== basePath && pathname.startsWith(item.href));
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
              <Box
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid rgba(218,226,214,0.9)',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <NotificationBell role={notificationRole} />
              </Box>
              <Menu shadow="md" width={200} radius="md" position="bottom-end">
                <Menu.Target>
                  <Avatar
                    size={38}
                    radius="xl"
                    color="green"
                    style={{
                      cursor: 'pointer',
                      border: '1px solid rgba(218,226,214,0.9)',
                      background: '#FFFFFF',
                      color: '#1F8F3A',
                      fontWeight: 800,
                      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                    }}
                  >
                    {avatarLabel}
                  </Avatar>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item leftSection={<Settings size={14} />} onClick={() => router.push('/account/settings')}>
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
