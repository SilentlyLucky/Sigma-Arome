'use client';

import type { ReactNode } from 'react';
import {
  IconArrowsSort,
  IconClipboardList,
  IconDashboard,
  IconPackage,
  IconTransferOut,
} from '@tabler/icons-react';
import { RoleAppShell, type RoleNavItem } from '@/components/layout/role-app-shell';

const NAV_ITEMS: RoleNavItem[] = [
  { label: 'Dashboard', href: '/logistic', icon: IconDashboard, section: 'Overview' },
  { label: 'Material Requests to Review', href: '/logistic/requests', icon: IconClipboardList, section: 'Coordination' },
  { label: 'Material Move Priorities', href: '/logistic/priority', icon: IconArrowsSort, section: 'Coordination' },
  { label: 'Material Release Progress', href: '/logistic/issue-monitor', icon: IconTransferOut, section: 'Monitoring' },
  { label: 'Finished Goods Storage', href: '/logistic/fg-putaway', icon: IconPackage, section: 'Monitoring' },
];

const SECTIONS = ['Overview', 'Coordination', 'Monitoring'];

export default function LogisticLayout({ children }: { children: ReactNode }) {
  return (
    <RoleAppShell
      avatarLabel="L"
      basePath="/logistic"
      navItems={NAV_ITEMS}
      notificationRole="logistic"
      roleLabel="Logistic Coordination"
      sections={SECTIONS}
      workspaceEyebrow="Coordination Center"
      workspaceTitle="Logistic Coordination"
    >
      {children}
    </RoleAppShell>
  );
}
