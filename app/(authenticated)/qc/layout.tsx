'use client';

import { AppShell, Burger, Group, NavLink, Text, Title, ActionIcon, Menu, Avatar, Divider } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconDashboard, IconFlask, IconClipboardCheck, IconAlertTriangle, IconLogout, IconSettings } from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';

// CV Review has been merged into Inspection History — no standalone tab needed.
const NAV_ITEMS = [
  { label: 'Dashboard', href: '/qc', icon: IconDashboard, section: 'Overview' },
  { label: 'Batches Waiting for Inspection', href: '/qc/queue', icon: IconFlask, section: 'Inspection' },
  { label: 'Inspection History', href: '/qc/history', icon: IconClipboardCheck, section: 'Records' },
  { label: 'Held and Rejected Batches', href: '/qc/holds', icon: IconAlertTriangle, section: 'Records' },
];
const SECTIONS = ['Overview', 'Inspection', 'Records'];

export default function QCLayout({ children }: { children: ReactNode }) {
  const [opened, { toggle }] = useDisclosure();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <AppShell header={{ height: 60 }} navbar={{ width: 260, breakpoint: 'sm', collapsed: { mobile: !opened } }} padding="md">
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Title order={4} c="grape">Sigma Arome</Title>
            <Text size="xs" c="dimmed" visibleFrom="sm">QC Workbench</Text>
          </Group>
          <Menu shadow="md" width={200}>
            <Menu.Target><ActionIcon variant="subtle" size="lg" radius="xl"><Avatar size="sm" color="grape">Q</Avatar></ActionIcon></Menu.Target>
            <Menu.Dropdown>
              <Menu.Item leftSection={<IconSettings size={14} />}>Settings</Menu.Item>
              <Menu.Divider />
              <Menu.Item leftSection={<IconLogout size={14} />} color="red" onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/login'); }}>Logout</Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </AppShell.Header>
      <AppShell.Navbar p="xs" style={{ overflowY: 'auto' }}>
        {SECTIONS.map((section, idx) => {
          const items = NAV_ITEMS.filter(i => i.section === section);
          return (
            <div key={section}>
              {idx > 0 && <Divider my="xs" />}
              <Text size="xs" c="dimmed" fw={700} tt="uppercase" px="xs" py={4}>{section}</Text>
              {items.map(item => (
                <NavLink
                  key={item.href}
                  component={Link}
                  href={item.href}
                  label={item.label}
                  leftSection={<item.icon size={16} />}
                  active={pathname === item.href || (item.href !== '/qc' && pathname.startsWith(item.href))}
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
