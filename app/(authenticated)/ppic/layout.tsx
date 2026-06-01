'use client';

import type { ReactNode } from 'react';
import {
  IconBuildingFactory,
  IconClipboardList,
  IconDashboard,
  IconPackageExport,
  IconShoppingCart,
} from '@tabler/icons-react';
import { RoleAppShell, type RoleNavItem } from '@/components/layout/role-app-shell';

const NAV_ITEMS: RoleNavItem[] = [
  { label: 'Dashboard', href: '/ppic', icon: IconDashboard, section: 'Overview' },
  { label: 'Raw Material Orders', href: '/ppic/orders', icon: IconShoppingCart, section: 'Ordering' },
  { label: 'Product Formulas', href: '/ppic/bom', icon: IconClipboardList, section: 'Planning' },
  { label: 'Production Orders', href: '/ppic/production', icon: IconBuildingFactory, section: 'Planning' },
  { label: 'Materials Ready for Production', href: '/ppic/readiness', icon: IconPackageExport, section: 'Monitoring' },
];

const SECTIONS = ['Overview', 'Ordering', 'Planning', 'Monitoring'];

export default function PPICLayout({ children }: { children: ReactNode }) {
  return (
    <RoleAppShell
      avatarLabel="P"
      basePath="/ppic"
      navItems={NAV_ITEMS}
      notificationRole="ppic"
      roleLabel="PPIC Planning"
      sections={SECTIONS}
    >
      {children}
    </RoleAppShell>
  );
}
