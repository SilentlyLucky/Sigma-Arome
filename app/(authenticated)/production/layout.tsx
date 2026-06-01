'use client';

import type { ReactNode } from 'react';
import {
  IconDashboard,
  IconListDetails,
  IconPackage,
  IconPlayerPlay,
} from '@tabler/icons-react';
import { RoleAppShell, type RoleNavItem } from '@/components/layout/role-app-shell';

const NAV_ITEMS: RoleNavItem[] = [
  { label: 'Dashboard', href: '/production', icon: IconDashboard, section: 'Overview' },
  { label: 'Orders to Make', href: '/production/orders', icon: IconListDetails, section: 'Production' },
  { label: 'Work in Progress', href: '/production/active', icon: IconPlayerPlay, section: 'Production' },
  { label: 'Finished Orders', href: '/production/completed', icon: IconPackage, section: 'Records' },
];

const SECTIONS = ['Overview', 'Production', 'Records'];

export default function ProductionLayout({ children }: { children: ReactNode }) {
  return (
    <RoleAppShell
      avatarLabel="P"
      basePath="/production"
      navItems={NAV_ITEMS}
      notificationRole="production"
      roleLabel="Production Workbench"
      sections={SECTIONS}
      workspaceEyebrow="Production Floor"
      workspaceTitle="Production Workbench"
    >
      {children}
    </RoleAppShell>
  );
}
