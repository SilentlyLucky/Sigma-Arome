'use client';

import {
  ActionIcon,
  AppShell,
  Avatar,
  Box,
  Burger,
  Group,
  Menu,
  NavLink,
  Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { LogOut, Settings } from 'lucide-react';
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { NotificationBell } from '@/components/NotificationBell';
import styles from './role-app-shell.module.css';

interface CurrentUser {
  email: string;
  first_name: string | null;
  last_name: string | null;
}

function getInitials(first: string | null, last: string | null, email: string, fallback: string): string {
  if (first && last) return `${first[0]}${last[0]}`.toUpperCase();
  if (first) return first[0].toUpperCase();
  return email[0]?.toUpperCase() ?? fallback;
}

function getDisplayName(user: CurrentUser | null): string {
  if (!user) return 'Account';
  return [user.first_name, user.last_name].filter(Boolean).join(' ') || user.email;
}

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
}

export function RoleAppShell({
  avatarLabel,
  basePath,
  children,
  navItems,
  notificationRole,
  roleLabel,
  sections,
}: RoleAppShellProps) {
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
  const initials = user ? getInitials(user.first_name, user.last_name, user.email, avatarLabel) : avatarLabel;

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
                {roleLabel}
              </Text>
            </Box>
          </Group>
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
                    styles={{
                      root: {
                        cursor: 'pointer',
                        border: '1px solid rgba(218,226,214,0.9)',
                        background: '#FFFFFF',
                        color: '#1F8F3A',
                        fontWeight: 800,
                        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                      },
                    }}
                  >
                    {initials}
                  </Avatar>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Label>{displayName}</Menu.Label>
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
