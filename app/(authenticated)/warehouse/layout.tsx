'use client';

import type { ReactNode } from 'react';
import {
  IconBarcode,
  IconBuildingWarehouse,
  IconDashboard,
  IconHistory,
  IconMap,
  IconMapPin,
  IconTruckDelivery,
  IconWand,
} from '@tabler/icons-react';
import { RoleAppShell, type RoleNavItem } from '@/components/layout/role-app-shell';

const NAV_ITEMS: RoleNavItem[] = [
  { label: 'Dashboard', href: '/warehouse', icon: IconDashboard, section: 'Overview' },
  { label: 'Floor Plan', href: '/warehouse/map', icon: IconMap, section: 'Overview' },
  { label: 'Expected Deliveries', href: '/warehouse/incoming', icon: IconTruckDelivery, section: 'Receiving' },
  { label: 'Receive Raw Materials', href: '/warehouse/receive', icon: IconTruckDelivery, section: 'Receiving' },
  { label: 'Batch Inventory', href: '/warehouse/batches', icon: IconBarcode, section: 'Inventory' },
  { label: 'Put Away Approved', href: '/warehouse/putaway', icon: IconMapPin, section: 'Inventory' },
  { label: 'Storage Suggestions', href: '/warehouse/slotting', icon: IconWand, section: 'Inventory' },
  { label: 'Movement Log', href: '/warehouse/movements', icon: IconHistory, section: 'History' },
  { label: 'Warehouse Locations', href: '/warehouse/warehouse-locations', icon: IconBuildingWarehouse, section: 'Reference' },
];

const SECTIONS = ['Overview', 'Receiving', 'Inventory', 'History', 'Reference'];

export default function WarehouseLayout({ children }: { children: ReactNode }) {
  return (
    <RoleAppShell
      avatarLabel="W"
      basePath="/warehouse"
      navItems={NAV_ITEMS}
      notificationRole="warehouse"
      roleLabel="Warehouse"
      sections={SECTIONS}
      workspaceEyebrow="Warehouse Ops"
      workspaceTitle="Warehouse Operation"
    >
      {children}
    </RoleAppShell>
  );
}
