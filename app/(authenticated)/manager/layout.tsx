'use client';

import type { ReactNode } from 'react';
import {
  IconBuildingFactory,
  IconDashboard,
  IconFlask,
  IconPackage,
  IconRoute,
  IconShoppingCart,
} from '@tabler/icons-react';
import { RoleAppShell, type RoleNavItem } from '@/components/layout/role-app-shell';

const NAV_ITEMS: RoleNavItem[] = [
  { label: 'Dashboard', href: '/manager', icon: IconDashboard, section: 'Overview' },
  { label: 'Raw Material Orders', href: '/manager/orders', icon: IconShoppingCart, section: 'Operations' },
  { label: 'Quality Checks', href: '/manager/qc', icon: IconFlask, section: 'Operations' },
  { label: 'Inventory', href: '/manager/inventory', icon: IconPackage, section: 'Operations' },
  { label: 'Production', href: '/manager/production', icon: IconBuildingFactory, section: 'Operations' },
  { label: 'Batch History', href: '/manager/traceability', icon: IconRoute, section: 'Traceability' },
];

const SECTIONS = ['Overview', 'Operations', 'Traceability'];

export default function ManagerLayout({ children }: { children: ReactNode }) {
  return (
    <RoleAppShell
      avatarLabel="M"
      basePath="/manager"
      navItems={NAV_ITEMS}
      notificationRole="manager"
      roleLabel="Manager Dashboard"
      sections={SECTIONS}
    >
      {children}
    </RoleAppShell>
  );
}
