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
  Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { ArrowLeft, Bell, ChevronDown, LogOut, Settings, UserRound } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';

interface CurrentUser {
  email: string;
  first_name: string | null;
  last_name: string | null;
}

function getInitials(first: string | null, last: string | null, email: string): string {
  if (first && last) return `${first[0]}${last[0]}`.toUpperCase();
  if (first) return first[0].toUpperCase();
  return email[0]?.toUpperCase() ?? 'U';
}

function getDisplayName(user: CurrentUser | null): string {
  if (!user) return 'Account';
  return [user.first_name, user.last_name].filter(Boolean).join(' ') || user.email;
}

export default function AccountLayout({ children }: { children: ReactNode }) {
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
    window.addEventListener('account-profile-updated', loadUser);
    return () => window.removeEventListener('account-profile-updated', loadUser);
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const displayName = getDisplayName(user);
  const initials = user ? getInitials(user.first_name, user.last_name, user.email) : 'U';

  return (
    <AppShell
      navbar={{ width: 268, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding={0}
      styles={{
        navbar: {
          top: 0,
          height: '100dvh',
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,249,248,0.96) 100%)',
          borderRight: '1px solid rgba(226, 229, 226, 0.95)',
          boxShadow: '10px 0 34px rgba(15, 23, 42, 0.035)',
          backdropFilter: 'blur(16px)',
        },
        main: {
          minHeight: '100vh',
          background:
            'radial-gradient(circle at 78% 0%, rgba(255,255,255,0.94) 0%, rgba(247,248,247,0.74) 28%, transparent 52%), radial-gradient(circle at 14% 8%, rgba(243,244,245,0.92) 0%, rgba(247,248,247,0.52) 34%, transparent 58%), linear-gradient(180deg, #F3F4F5 0%, #F7F8F7 22%, #F7F8F7 100%)',
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
                Account
              </Text>
            </Box>
          </Group>
        </Box>

        <Box px={12} pb={22}>
          <Text
            size="xs"
            fw={800}
            tt="uppercase"
            px={12}
            style={{ color: '#6E7B8B', letterSpacing: '0.06em', paddingTop: 2, paddingBottom: 8 }}
          >
            Preferences
          </Text>
          <NavLink
            component={Link}
            href="/account/settings"
            label="Account Settings"
            leftSection={<Settings size={17} strokeWidth={2} color="#1F8F3A" />}
            active={pathname === '/account/settings'}
            variant="light"
            color="green"
            styles={{
              root: {
                borderRadius: 8,
                minHeight: 44,
                marginBottom: 6,
                fontWeight: 700,
                color: '#152239',
              },
              label: { fontSize: 14 },
            }}
          />
        </Box>
      </AppShell.Navbar>

      <AppShell.Main>
        <Box px={{ base: 18, md: 34, xl: 48 }} py={{ base: 18, md: 32 }}>
          <Group justify="space-between" align="center" mb={{ base: 34, md: 42 }}>
            <Group gap={12}>
              <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" aria-label="Toggle navigation" />
              <Tooltip label="Back to previous page" position="right">
                <ActionIcon
                  variant="default"
                  size={52}
                  radius={8}
                  aria-label="Back to previous page"
                  onClick={() => router.back()}
                  styles={{
                    root: {
                      background: '#FFFFFF',
                      borderColor: '#E0E5E0',
                      boxShadow: '0 10px 26px rgba(15, 23, 42, 0.08)',
                    },
                  }}
                >
                  <ArrowLeft size={22} color="#465467" />
                </ActionIcon>
              </Tooltip>
              <Text fw={800} size="sm" style={{ color: '#17243A' }}>
                Back to Production Workbench
              </Text>
            </Group>

            <Group gap={14}>
              <Indicator label="1" size={18} color="red" offset={6}>
                <ActionIcon
                  variant="default"
                  radius="xl"
                  size={46}
                  aria-label="Notifications"
                  styles={{
                    root: {
                      background: '#FFFFFF',
                      borderColor: '#E4E8E4',
                      boxShadow: '0 10px 24px rgba(15, 23, 42, 0.08)',
                    },
                  }}
                >
                  <Bell size={20} color="#1F2A44" />
                </ActionIcon>
              </Indicator>

              <Menu shadow="lg" width={180} position="bottom-end" radius={8}>
                <Menu.Target>
                  <Group gap={10} style={{ cursor: 'pointer' }} wrap="nowrap">
                    <Avatar radius="xl" size={48} color="gray" styles={{ root: { boxShadow: '0 10px 24px rgba(15, 23, 42, 0.1)' } }}>
                      {initials}
                    </Avatar>
                    <ChevronDown size={18} color="#17243A" />
                  </Group>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Label>{displayName}</Menu.Label>
                  <Menu.Item leftSection={<UserRound size={15} />}>Profile</Menu.Item>
                  <Menu.Item leftSection={<Settings size={15} />}>Settings</Menu.Item>
                  <Menu.Divider />
                  <Menu.Item color="red" leftSection={<LogOut size={15} />} onClick={handleLogout}>
                    Logout
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </Group>
          </Group>

          <Box style={{ maxWidth: 1280 }}>
            {children}
          </Box>
        </Box>
      </AppShell.Main>
    </AppShell>
  );
}
