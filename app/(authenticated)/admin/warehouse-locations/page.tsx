'use client';

import { Stack, Title, Text, Tabs } from '@mantine/core';
import {
  IconMap,
  IconBinaryTree2,
  IconBuildingWarehouse,
  IconViewfinder,
  IconStack2,
  IconBox,
  IconPackages,
} from '@tabler/icons-react';
import { FloorPlanTab } from './_tabs/floor-plan-tab';
import { TreeViewTab } from './_tabs/tree-view-tab';
import { WarehousesTab } from './_tabs/warehouses-tab';
import { ZonesTab } from './_tabs/zones-tab';
import { RacksTab } from './_tabs/racks-tab';
import { BinsTab } from './_tabs/bins-tab';
import { InventoryViewTab } from './_tabs/inventory-view-tab';

/**
 * Warehouse Location — single sidebar menu, tabbed UI.
 *
 * Hierarchy: Warehouse → Zone → Rack → Bin (= warehouse_locations).
 * Actual inventory always lives at the Bin level.
 * Overview tab shows the live Warehouse Floor Plan.
 * Auto Slotting lives in the Warehouse Operation module (/warehouse/slotting).
 */
export default function WarehouseLocationPage() {
  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Warehouse Location</Title>
        <Text c="dimmed" size="sm">
          Manage the warehouse hierarchy — Warehouse → Zone → Rack → Bin — plus live inventory
          view.
        </Text>
      </div>

      <Tabs defaultValue="overview" keepMounted={false}>
        <Tabs.List>
          <Tabs.Tab value="overview" leftSection={<IconMap size={16} />}>
            Overview
          </Tabs.Tab>
          <Tabs.Tab value="tree" leftSection={<IconBinaryTree2 size={16} />}>
            Tree View
          </Tabs.Tab>
          <Tabs.Tab value="warehouses" leftSection={<IconBuildingWarehouse size={16} />}>
            Warehouses
          </Tabs.Tab>
          <Tabs.Tab value="zones" leftSection={<IconViewfinder size={16} />}>
            Zones
          </Tabs.Tab>
          <Tabs.Tab value="racks" leftSection={<IconStack2 size={16} />}>
            Racks
          </Tabs.Tab>
          <Tabs.Tab value="bins" leftSection={<IconBox size={16} />}>
            Bins
          </Tabs.Tab>
          <Tabs.Tab value="inventory" leftSection={<IconPackages size={16} />}>
            Inventory View
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="overview" pt="md">
          <FloorPlanTab />
        </Tabs.Panel>
        <Tabs.Panel value="tree" pt="md">
          <TreeViewTab />
        </Tabs.Panel>
        <Tabs.Panel value="warehouses" pt="md">
          <WarehousesTab />
        </Tabs.Panel>
        <Tabs.Panel value="zones" pt="md">
          <ZonesTab />
        </Tabs.Panel>
        <Tabs.Panel value="racks" pt="md">
          <RacksTab />
        </Tabs.Panel>
        <Tabs.Panel value="bins" pt="md">
          <BinsTab />
        </Tabs.Panel>
        <Tabs.Panel value="inventory" pt="md">
          <InventoryViewTab />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}
