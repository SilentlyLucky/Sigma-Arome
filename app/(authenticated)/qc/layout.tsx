'use client';

import type { ReactNode } from 'react';
import {
  IconAlertTriangle,
  IconClipboardCheck,
  IconDashboard,
  IconFlask,
} from '@tabler/icons-react';
import { RoleAppShell, type RoleNavItem } from '@/components/layout/role-app-shell';

const NAV_ITEMS: RoleNavItem[] = [
  { label: 'Dashboard', href: '/qc', icon: IconDashboard, section: 'Overview' },
  { label: 'Batches Waiting for Inspection', href: '/qc/queue', icon: IconFlask, section: 'Inspection' },
  { label: 'Inspection History', href: '/qc/history', icon: IconClipboardCheck, section: 'Records' },
  { label: 'Held and Rejected Batches', href: '/qc/holds', icon: IconAlertTriangle, section: 'Records' },
];

const SECTIONS = ['Overview', 'Inspection', 'Records'];

export default function QCLayout({ children }: { children: ReactNode }) {
  return (
    <RoleAppShell
      avatarLabel="Q"
      basePath="/qc"
      navItems={NAV_ITEMS}
      notificationRole="qc"
      roleLabel="QC Workbench"
      sections={SECTIONS}
      workspaceEyebrow="Quality Center"
      workspaceTitle="QC Workbench"
    >
      {children}
    </RoleAppShell>
  );
}
