'use client';

import { CrudTab } from './crud-tab';

export function ZonesTab() {
  return (
    <CrudTab
      collection="zones"
      description="Zones within a warehouse (e.g. Cold Room A). A zone defines the working temperature range."
      fields={['code', 'name', 'warehouse_id', 'temperature_min', 'temperature_max', 'status']}
      createTitle="Create Zone"
      editTitle="Edit Zone"
      excludeFields={['date_created', 'date_updated']}
    />
  );
}
