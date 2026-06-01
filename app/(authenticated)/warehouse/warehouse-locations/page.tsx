'use client';

import { Stack, Title, Text, Tabs } from '@mantine/core';
import {
  IconMap,
  IconBinaryTree2,
  IconBuildingWarehouse,
  IconViewfinder,
  IconStack2,
  IconBox,
} from '@tabler/icons-react';
import { CollectionList } from '@/components/ui/collection-list';
import { FloorPlanTab } from '@/app/(authenticated)/admin/warehouse-locations/_tabs/floor-plan-tab';
import { TreeViewTab } from '@/app/(authenticated)/admin/warehouse-locations/_tabs/tree-view-tab';

function ReadOnlyTab({
  collection,
  description,
  fields,
}: {
  collection: string;
  description: string;
  fields: string[];
}) {
  return (
    <Stack gap="md">
      <Text c="dimmed" size="sm">
        {description}
      </Text>
      <CollectionList
        collection={collection}
        fields={fields}
        enableSearch
        enableSort
        enableResize
      />
    </Stack>
  );
}

export default function WarehouseLocationsPage() {
  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Warehouse Locations</Title>
        <Text c="dimmed" size="sm">
          View the warehouse hierarchy — Warehouse → Zone → Rack → Bin — and live inventory.
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
        </Tabs.List>

        <Tabs.Panel value="overview" pt="md">
          <FloorPlanTab />
        </Tabs.Panel>
        <Tabs.Panel value="tree" pt="md">
          <TreeViewTab />
        </Tabs.Panel>
        <Tabs.Panel value="warehouses" pt="md">
          <ReadOnlyTab
            collection="warehouses"
            description="Top-level warehouse buildings."
            fields={['code', 'name', 'description', 'status']}
          />
        </Tabs.Panel>
        <Tabs.Panel value="zones" pt="md">
          <ReadOnlyTab
            collection="zones"
            description="Zones within each warehouse."
            fields={['code', 'name', 'warehouse_id']}
          />
        </Tabs.Panel>
        <Tabs.Panel value="racks" pt="md">
          <ReadOnlyTab
            collection="racks"
            description="Racks within each zone."
            fields={['code', 'zone_id']}
          />
        </Tabs.Panel>
        <Tabs.Panel value="bins" pt="md">
          <ReadOnlyTab
            collection="warehouse_locations"
            description="Individual storage bins (the lowest level of the hierarchy)."
            fields={['location_code', 'rack_id', 'capacity_kg', 'current_occupancy_kg', 'capacity_pcs', 'current_occupancy_pcs', 'is_active']}
          />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}
