'use client';

import { Badge } from '@mantine/core';
import { CrudTab } from './crud-tab';

export function WarehousesTab() {
  return (
    <CrudTab
      collection="warehouses"
      description="Top-level warehouse buildings (Raw Material, Packaging, Finished Goods, Quarantine, Rejected)."
      fields={['code', 'name', 'description', 'status']}
      createTitle="Create Warehouse"
      editTitle="Edit Warehouse"
      excludeFields={['date_created', 'date_updated']}
      renderCell={(item, header) => {
        if (header.value === 'status') {
          const v = String(item.status ?? '');
          return (
            <Badge color={v === 'active' ? 'green' : 'gray'} variant="light">
              {v || '—'}
            </Badge>
          );
        }
        return null;
      }}
    />
  );
}
